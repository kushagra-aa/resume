import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { resumeDatabase } from '#/db/client'
import { resumeRepository } from '#/db/repositories/resume-repository'
import type { ResumeDocument } from '#/models/resume'
import { parseResumeDocument } from '#/schemas/resume'

const document: ResumeDocument = {
  id: 'resume-1',
  name: 'My Resume',
  html: '<main>Resume</main>',
  css: 'main { color: black; }',
  createdAt: '2026-09-27T00:00:00.000Z',
  updatedAt: '2026-09-27T00:00:00.000Z',
}

describe('resume document schema', () => {
  it('rejects incomplete documents', () => {
    expect(() => parseResumeDocument({ id: document.id })).toThrow()
  })
})

describe('resume repository', () => {
  beforeEach(async () => {
    await resumeDatabase.documents.clear()
  })

  it('creates, lists, gets, updates, duplicates, and deletes documents', async () => {
    await resumeRepository.create(document)

    expect(await resumeRepository.get(document.id)).toEqual(document)
    expect(await resumeRepository.list()).toEqual([document])

    const updated = { ...document, name: 'Updated Resume' }
    await resumeRepository.update(updated)
    expect(await resumeRepository.get(document.id)).toEqual(updated)

    const duplicate = await resumeRepository.duplicate(updated)
    expect(duplicate.id).not.toBe(document.id)
    expect(duplicate.name).toBe('Updated Resume Copy')
    expect(await resumeRepository.list()).toHaveLength(2)

    await resumeRepository.delete(document.id)
    expect(await resumeRepository.get(document.id)).toBeNull()
  })

  it('skips malformed records when reading', async () => {
    await resumeDatabase.documents.put({ id: 'malformed' } as ResumeDocument)

    expect(await resumeRepository.get('malformed')).toBeNull()
    expect(await resumeRepository.list()).toEqual([])
  })
})
