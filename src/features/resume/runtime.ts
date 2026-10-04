import type { ResumeDocument } from '#/models/resume'

export function createResumeSrcDoc(
  document: ResumeDocument,
  reportHeight = true,
  mode: 'preview' | 'print' = 'preview',
) {
  const printStyles =
    mode === 'print'
      ? `<style>
          @page{size:A4;margin:8mm}
          html, body { margin: 0; padding: 0; background: #fff; }
          *, *::before, *::after { box-sizing: border-box; }
          h1, h2, h3, h4, article, li, .role, .project, .experience,
          .education, .certifications {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          h1, h2, h3, h4 {
            break-after: avoid;
            page-break-after: avoid;
          }
          @media print {
            .resume {
              width: auto !important;
              min-height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        </style>`
      : ''
  const heightReporter = reportHeight
    ? `<script>(()=>{const report=()=>{const height=Array.from(document.body.children).reduce((max,element)=>Math.max(max,element.getBoundingClientRect().bottom+window.scrollY),1123);parent.postMessage({type:'resume-preview-height',height},'*')};window.addEventListener('message',event=>{if(event.data?.type==='resume-print')window.print()});new ResizeObserver(report).observe(document.body);window.addEventListener('load',report);report()})()</script>`
    : ''

  return `<!doctype html><html><head><meta charset="utf-8"><style>${document.css}</style>${printStyles}</head><body>${document.html}${heightReporter}</body></html>`
}
