import type { ResumeDocument } from '#/models/resume'
import { parseResumeDocument, safeParseResumeDocument } from '#/schemas/resume'

import { resumeDatabase } from '../client'
import { resumeHistoryRepository } from './resume-history-repository'

export class ResumeStorageUnavailableError extends Error {
  constructor() {
    super('Resume storage is unavailable in this environment.')
    this.name = 'ResumeStorageUnavailableError'
  }
}

function assertStorageAvailable() {
  if (typeof indexedDB === 'undefined') {
    throw new ResumeStorageUnavailableError()
  }
}

function cloneDocument(document: ResumeDocument): ResumeDocument {
  return { ...document }
}

export const resumeRepository = {
  async create(document: ResumeDocument): Promise<ResumeDocument> {
    assertStorageAvailable()
    const validated = parseResumeDocument(document)
    await resumeDatabase.documents.add(validated)
    return cloneDocument(validated)
  },

  async get(id: string): Promise<ResumeDocument | null> {
    assertStorageAvailable()
    const value = await resumeDatabase.documents.get(id)
    const parsed = safeParseResumeDocument(value)
    return parsed.success ? cloneDocument(parsed.data) : null
  },

  async list(): Promise<ResumeDocument[]> {
    assertStorageAvailable()
    const values = await resumeDatabase.documents
      .orderBy('updatedAt')
      .reverse()
      .toArray()

    return values.flatMap((value) => {
      const parsed = safeParseResumeDocument(value)
      return parsed.success ? [cloneDocument(parsed.data)] : []
    })
  },

  async update(document: ResumeDocument): Promise<ResumeDocument> {
    assertStorageAvailable()
    const validated = parseResumeDocument(document)
    const previous = await resumeRepository.get(validated.id)
    if (previous)
      await resumeHistoryRepository.recordBeforeUpdate(
        previous,
        validated,
        'source',
      )
    const updated = await resumeDatabase.documents.update(
      validated.id,
      validated,
    )
    if (updated === 0) {
      throw new Error(`Resume document not found: ${validated.id}`)
    }
    return cloneDocument(validated)
  },

  async duplicate(
    document: ResumeDocument,
    name = `${document.name} Copy`,
  ): Promise<ResumeDocument> {
    const now = new Date().toISOString()
    const duplicate = parseResumeDocument({
      ...document,
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: now,
    })
    return resumeRepository.create(duplicate)
  },

  async delete(id: string): Promise<void> {
    assertStorageAvailable()
    await resumeDatabase.documents.delete(id)
    await resumeHistoryRepository.deleteByResumeId(id)
  },
}
