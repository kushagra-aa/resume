import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resumeDatabase } from '#/db/client'
import { loadResumes } from '#/features/resume/services/resume-storage'
import type { ResumeDocument } from '#/models/resume'

describe('resume storage startup behavior', () => {
  beforeEach(async () => {
    await resumeDatabase.documents.clear()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => null),
      },
    })
  })

  it('creates one starter resume when storage is empty', async () => {
    const resumes = await loadResumes()

    expect(resumes).toHaveLength(1)
    expect(resumes[0]?.html).toContain('<main class="resume">')
    expect(await resumeDatabase.documents.count()).toBe(1)
  })

  it('ignores malformed legacy data and recovers with a starter', async () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn(() => '{not valid json'),
      },
    })

    const resumes = await loadResumes()

    expect(resumes).toHaveLength(1)
    expect(await resumeDatabase.documents.count()).toBe(1)
  })

  it('migrates valid MVP localStorage documents without changing their source', async () => {
    const legacyDocument: ResumeDocument = {
      id: 'mvp-local-document',
      name: 'My old resume',
      html: '<main>Original HTML</main>',
      css: '.resume { color: teal; }',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-02T00:00:00.000Z',
    }
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn((key: string) =>
          key === 'resume:poc:documents'
            ? JSON.stringify([legacyDocument])
            : null,
        ),
      },
    })

    const loaded = await loadResumes()

    expect(loaded).toEqual([legacyDocument])
    expect(await resumeDatabase.documents.get(legacyDocument.id)).toEqual(
      legacyDocument,
    )
  })
})
