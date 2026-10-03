import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resumeDatabase } from '#/db/client'
import { loadResumes } from '#/features/resume/services/resume-storage'

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
})
