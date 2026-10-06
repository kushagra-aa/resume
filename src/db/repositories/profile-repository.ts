import type { Profile } from '#/models/profile'
import { parseProfile, safeParseProfile } from '#/schemas/profile'

import { resumeDatabase } from '../client'

export class ProfileStorageUnavailableError extends Error {
  constructor() {
    super('Profile storage is unavailable in this environment.')
    this.name = 'ProfileStorageUnavailableError'
  }
}

function assertStorageAvailable() {
  if (typeof indexedDB === 'undefined')
    throw new ProfileStorageUnavailableError()
}

function cloneProfile(profile: Profile): Profile {
  return structuredClone(profile)
}

export const profileRepository = {
  async create(profile: Profile): Promise<Profile> {
    assertStorageAvailable()
    const validated = parseProfile(profile)
    await resumeDatabase.profiles.add(validated)
    return cloneProfile(validated)
  },

  async get(id: string): Promise<Profile | null> {
    assertStorageAvailable()
    const value = await resumeDatabase.profiles.get(id)
    const parsed = safeParseProfile(value)
    return parsed.success ? cloneProfile(parsed.data) : null
  },

  async list(): Promise<Profile[]> {
    assertStorageAvailable()
    const values = await resumeDatabase.profiles
      .orderBy('updatedAt')
      .reverse()
      .toArray()
    return values.flatMap((value) => {
      const parsed = safeParseProfile(value)
      return parsed.success ? [cloneProfile(parsed.data)] : []
    })
  },

  async update(profile: Profile): Promise<Profile> {
    assertStorageAvailable()
    const validated = parseProfile(profile)
    const updated = await resumeDatabase.profiles.update(
      validated.id,
      validated,
    )
    if (updated === 0) throw new Error(`Profile not found: ${validated.id}`)
    return cloneProfile(validated)
  },

  async duplicate(
    profile: Profile,
    name = `${profile.name} Copy`,
  ): Promise<Profile> {
    const now = new Date().toISOString()
    return profileRepository.create(
      parseProfile({
        ...profile,
        id: crypto.randomUUID(),
        name,
        createdAt: now,
        updatedAt: now,
      }),
    )
  },

  async delete(id: string): Promise<void> {
    assertStorageAvailable()
    const linkedResumes = await resumeDatabase.structuredResumes
      .where('profileId')
      .equals(id)
      .count()
    if (linkedResumes > 0) {
      throw new Error(
        'Delete or reassign this profile’s resumes before deleting it.',
      )
    }
    await resumeDatabase.profiles.delete(id)
  },
}
