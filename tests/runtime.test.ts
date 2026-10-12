import { describe, expect, it } from 'vitest'

import { createResumeSrcDoc } from '#/features/resume/runtime'
import {
  A4_PAGE_HEIGHT_PX,
  estimatePrintPageCount,
  isPrintPageMargins,
} from '#/features/resume/print-pagination'

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
    const print = createResumeSrcDoc(document, true, 'print')

    expect(preview).toContain(document.html)
    expect(preview).toContain(document.css)
    expect(print).toContain(document.html)
    expect(print).toContain(document.css)
    expect(print).toContain('@page{size:A4;margin:8mm}')
    expect(print).toContain('id="resume-print-overrides"')
    expect(print).toContain('section { break-inside: auto !important;')
    expect(print).toContain("event.data?.type==='resume-print'")
  })

  it('reports preview height only when requested', () => {
    expect(createResumeSrcDoc(document, false)).not.toContain('postMessage')
    expect(createResumeSrcDoc(document, true)).toContain('postMessage')
  })
})

describe('print pagination', () => {
  const margins = { top: 40, right: 30, bottom: 40, left: 30 }

  it('counts against the printable A4 height after vertical margins', () => {
    const printableHeight = A4_PAGE_HEIGHT_PX - margins.top - margins.bottom

    expect(estimatePrintPageCount(printableHeight, margins)).toBe(1)
    expect(estimatePrintPageCount(printableHeight * 2, margins)).toBe(2)
    expect(estimatePrintPageCount(printableHeight + 2, margins)).toBe(2)
  })

  it('uses the print fallback margin when layout data is unavailable', () => {
    const printableHeight = A4_PAGE_HEIGHT_PX - (16 / 25.4) * 96

    expect(estimatePrintPageCount(null, null)).toBe(1)
    expect(estimatePrintPageCount(printableHeight, null)).toBe(1)
  })

  it('validates margin reports from the preview iframe', () => {
    expect(isPrintPageMargins(margins)).toBe(true)
    expect(isPrintPageMargins({ ...margins, top: Number.NaN })).toBe(false)
    expect(isPrintPageMargins(null)).toBe(false)
  })
})
