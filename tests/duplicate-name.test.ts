import { describe, expect, it } from 'vitest'

import { createResumeCopyName } from '#/features/resume/duplicate-name'

describe('resume copy names', () => {
  it('creates a readable unique copy name', () => {
    expect(createResumeCopyName('Backend Resume', [])).toBe(
      'Backend Resume Copy',
    )
    expect(
      createResumeCopyName('Backend Resume', [
        'Backend Resume Copy',
        'Backend Resume Copy 2',
      ]),
    ).toBe('Backend Resume Copy 3')
  })

  it('compares names without case sensitivity or surrounding spaces', () => {
    expect(createResumeCopyName('Resume', [' resume copy '])).toBe(
      'Resume Copy 2',
    )
  })
})
