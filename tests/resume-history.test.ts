import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { resumeDatabase } from '#/db/client'
import { resumeHistoryRepository } from '#/db/repositories/resume-history-repository'
import type { ResumeDocument } from '#/models/resume'

const document: ResumeDocument = {
  id: 'history-document',
  name: 'History Resume',
  html: '<main>Before</main>',
  css: '',
  createdAt: '2026-10-12T00:00:00.000Z',
  updatedAt: '2026-10-12T00:00:00.000Z',
}

describe('resume history', () => {
  beforeEach(async () => {
    await resumeDatabase.resumeHistory.clear()
  })

  it('keeps a bounded checkpoint of the prior version and lists newest first', async () => {
    await resumeHistoryRepository.recordBeforeUpdate(
      document,
      { ...document, html: '<main>After</main>' },
      'source',
    )

    const entries = await resumeHistoryRepository.list(document.id)
    expect(entries).toHaveLength(1)
    expect(entries[0]?.snapshot).toEqual(document)
    expect(entries[0]?.kind).toBe('source')
  })

  it('does not create checkpoints for unchanged content or rapid autosaves', async () => {
    await resumeHistoryRepository.recordBeforeUpdate(
      document,
      document,
      'source',
    )
    await resumeHistoryRepository.recordBeforeUpdate(
      document,
      { ...document, html: '<main>After</main>' },
      'source',
    )
    await resumeHistoryRepository.recordBeforeUpdate(
      { ...document, html: '<main>After</main>' },
      { ...document, html: '<main>Latest</main>' },
      'source',
    )

    expect(await resumeHistoryRepository.list(document.id)).toHaveLength(1)
  })

  it('deletes checkpoints with their resume', async () => {
    await resumeHistoryRepository.recordBeforeUpdate(
      document,
      { ...document, html: '<main>After</main>' },
      'source',
    )
    await resumeHistoryRepository.deleteByResumeId(document.id)

    expect(await resumeHistoryRepository.list(document.id)).toEqual([])
  })
})
