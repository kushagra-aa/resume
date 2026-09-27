import type { ResumeDocument } from '#/models/resume'

export function createResumeSrcDoc(
  document: ResumeDocument,
  reportHeight = true,
) {
  const heightReporter = reportHeight
    ? `<script>(()=>{const report=()=>{const height=Array.from(document.body.children).reduce((max,element)=>Math.max(max,element.getBoundingClientRect().bottom+window.scrollY),1123);parent.postMessage({type:'resume-preview-height',height},'*')};new ResizeObserver(report).observe(document.body);window.addEventListener('load',report);report()})()</script>`
    : ''

  return `<!doctype html><html><head><meta charset="utf-8"><style>${document.css}</style></head><body>${document.html}${heightReporter}</body></html>`
}
