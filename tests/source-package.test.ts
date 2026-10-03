import { describe, expect, it } from 'vitest'

import {
  createResumePackage,
  readResumePackage,
} from '#/features/resume/source-package'

describe('resume source packages', () => {
  it('round-trips the exact source files and manifest', () => {
    const document = {
      id: 'resume-1',
      name: 'My Resume',
      html: '<main>Exact HTML</main>\n',
      css: 'main { color: red; }\n',
      createdAt: '2026-09-30T00:00:00.000Z',
      updatedAt: '2026-09-30T00:00:00.000Z',
    }
    const entries = readResumePackage(createResumePackage(document))

    expect(new TextDecoder().decode(entries.get('resume.html'))).toBe(
      document.html,
    )
    expect(new TextDecoder().decode(entries.get('resume.css'))).toBe(
      document.css,
    )
    expect(
      JSON.parse(new TextDecoder().decode(entries.get('manifest.json'))),
    ).toEqual({
      format: 'resume-source-package',
      packageVersion: 1,
      name: document.name,
    })
  })

  it('rejects malformed ZIP input', () => {
    expect(() => readResumePackage(new Uint8Array([1, 2, 3]))).toThrow(
      'valid ZIP file',
    )
  })
})
