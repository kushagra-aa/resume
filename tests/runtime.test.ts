import { describe, expect, it } from 'vitest'

import { createResumeSrcDoc } from '#/features/resume/runtime'

const document = {
  id: 'runtime-1',
  name: 'Runtime test',
  html: '<main><a href="https://example.com">Example</a></main>',
  css: 'main { color: red; }',
  createdAt: '2026-10-03T00:00:00.000Z',
  updatedAt: '2026-10-03T00:00:00.000Z',
}

describe('resume runtime', () => {
  it('keeps the same source for preview and print modes', () => {
    const preview = createResumeSrcDoc(document, false)
    const print = createResumeSrcDoc(document, false, 'print')

    expect(preview).toContain(document.html)
    expect(preview).toContain(document.css)
    expect(print).toContain(document.html)
    expect(print).toContain(document.css)
    expect(print).toContain('@page{size:A4;margin:0}')
  })

  it('reports preview height only when requested', () => {
    expect(createResumeSrcDoc(document, false)).not.toContain('postMessage')
    expect(createResumeSrcDoc(document, true)).toContain('postMessage')
  })
})
