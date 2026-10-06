import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { resumeDatabase } from '#/db/client'
import { profileRepository } from '#/db/repositories/profile-repository'
import { createEmptyProfile } from '#/features/profiles/profile-defaults'
import { parseProfile } from '#/schemas/profile'

describe('profile schema', () => {
  it('rejects incomplete profiles', () => {
    expect(() => parseProfile({ id: 'profile-1' })).toThrow()
  })
})

describe('profile repository', () => {
  beforeEach(async () => {
    await resumeDatabase.profiles.clear()
  })

  it('creates, lists, gets, updates, duplicates, and deletes profiles', async () => {
    const profile = createEmptyProfile('My Profile')
    await profileRepository.create(profile)

    expect(await profileRepository.get(profile.id)).toEqual(profile)
    expect(await profileRepository.list()).toEqual([profile])

    const updated = { ...profile, name: 'Updated Profile' }
    await profileRepository.update(updated)
    expect(await profileRepository.get(profile.id)).toEqual(updated)

    const duplicate = await profileRepository.duplicate(updated)
    expect(duplicate.id).not.toBe(profile.id)
    expect(duplicate.name).toBe('Updated Profile Copy')
    expect(await profileRepository.list()).toHaveLength(2)

    await profileRepository.delete(profile.id)
    expect(await profileRepository.get(profile.id)).toBeNull()
  })

  it('skips malformed records when reading', async () => {
    await resumeDatabase.profiles.put({ id: 'malformed' } as never)

    expect(await profileRepository.get('malformed')).toBeNull()
    expect(await profileRepository.list()).toEqual([])
  })
})
