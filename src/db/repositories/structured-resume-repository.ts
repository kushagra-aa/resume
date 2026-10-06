import type { StructuredResume } from '#/models/structured-resume'
import {
  parseStructuredResume,
  safeParseStructuredResume,
} from '#/schemas/structured-resume'

import { resumeDatabase } from '../client'

function assertStorageAvailable() {
  if (typeof indexedDB === 'undefined') {
    throw new Error('Resume storage is unavailable in this environment.')
  }
}

function cloneResume(resume: StructuredResume): StructuredResume {
  return structuredClone(resume)
}

export const structuredResumeRepository = {
  async create(resume: StructuredResume): Promise<StructuredResume> {
    assertStorageAvailable()
    const validated = parseStructuredResume(resume)
    await resumeDatabase.structuredResumes.add(validated)
    return cloneResume(validated)
  },

  async get(id: string): Promise<StructuredResume | null> {
    assertStorageAvailable()
    const parsed = safeParseStructuredResume(
      await resumeDatabase.structuredResumes.get(id),
    )
    return parsed.success ? cloneResume(parsed.data) : null
  },

  async list(): Promise<StructuredResume[]> {
    assertStorageAvailable()
    const values = await resumeDatabase.structuredResumes
      .orderBy('updatedAt')
      .reverse()
      .toArray()
    return values.flatMap((value) => {
      const parsed = safeParseStructuredResume(value)
      return parsed.success ? [cloneResume(parsed.data)] : []
    })
  },

  async update(resume: StructuredResume): Promise<StructuredResume> {
    assertStorageAvailable()
    const validated = parseStructuredResume(resume)
    const updated = await resumeDatabase.structuredResumes.update(
      validated.id,
      validated,
    )
    if (!updated)
      throw new Error(`Structured resume not found: ${validated.id}`)
    return cloneResume(validated)
  },

  async duplicate(
    resume: StructuredResume,
    name = `${resume.name} Copy`,
  ): Promise<StructuredResume> {
    const now = new Date().toISOString()
    return structuredResumeRepository.create({
      ...resume,
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: now,
    })
  },

  async delete(id: string): Promise<void> {
    assertStorageAvailable()
    await resumeDatabase.structuredResumes.delete(id)
  },

  async listByProfile(profileId: string): Promise<StructuredResume[]> {
    assertStorageAvailable()
    const values = await resumeDatabase.structuredResumes
      .where('profileId')
      .equals(profileId)
      .toArray()
    return values.flatMap((value) => {
      const parsed = safeParseStructuredResume(value)
      return parsed.success ? [cloneResume(parsed.data)] : []
    })
  },
}
