import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { resumeDatabase } from '#/db/client'
import { resumeRepository } from '#/db/repositories/resume-repository'
import type { ResumeDocument } from '#/models/resume'

const initialDocument: ResumeDocument = {
  id: 'workflow-1',
  name: 'Workflow Resume',
  html: '<main>Initial</main>',
  css: 'main { color: black; }',
  createdAt: '2026-10-03T00:00:00.000Z',
  updatedAt: '2026-10-03T00:00:00.000Z',
}

describe('resume editing workflow persistence', () => {
  beforeEach(async () => {
    await resumeDatabase.documents.clear()
  })

  it('persists an edit so a later load reopens the updated source', async () => {
    await resumeRepository.create(initialDocument)
    await resumeRepository.update({
      ...initialDocument,
      html: '<main>Edited and autosaved</main>',
      updatedAt: '2026-10-03T00:01:00.000Z',
    })

    const afterRefresh = await resumeRepository.list()
    const reopened = await resumeRepository.get(initialDocument.id)

    expect(afterRefresh[0]?.html).toContain('Edited and autosaved')
    expect(reopened?.html).toContain('Edited and autosaved')
  })
})
