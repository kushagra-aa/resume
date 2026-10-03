import type { ResumeDocument } from '#/models/resume'

export function createResumeSrcDoc(
  document: ResumeDocument,
  reportHeight = true,
  mode: 'preview' | 'print' = 'preview',
) {
  const printStyles =
    mode === 'print'
      ? '<style>@page{size:A4;margin:0}html,body{margin:0;padding:0;background:#fff}*{box-sizing:border-box}</style>'
      : ''
  const heightReporter = reportHeight
    ? `<script>(()=>{const report=()=>{const height=Array.from(document.body.children).reduce((max,element)=>Math.max(max,element.getBoundingClientRect().bottom+window.scrollY),1123);parent.postMessage({type:'resume-preview-height',height},'*')};new ResizeObserver(report).observe(document.body);window.addEventListener('load',report);report()})()</script>`
    : ''

  return `<!doctype html><html><head><meta charset="utf-8"><style>${document.css}</style>${printStyles}</head><body>${document.html}${heightReporter}</body></html>`
}
