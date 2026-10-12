import type { ResumeDocument } from '#/models/resume'

export function createResumeSrcDoc(
  document: ResumeDocument,
  reportHeight = true,
  mode: 'preview' | 'print' = 'preview',
) {
  const printStyles =
    mode === 'print'
      ? `<style id="resume-print-overrides">
          html, body { margin: 0; padding: 0; background: #fff; }
          *, *::before, *::after { box-sizing: border-box; }
          article, li, .role, .project, .experience, .education, .certifications {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          h1, h2, h3, h4 {
            break-after: avoid;
            page-break-after: avoid;
          }
          @media print {
            section { break-inside: auto !important; page-break-inside: auto !important; }
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
    ? `<script>(()=>{const fallback=8/25.4*96;const root=()=>document.querySelector('.resume');const margins=()=>{const element=root();if(!element)return{top:fallback,right:fallback,bottom:fallback,left:fallback};const style=getComputedStyle(element);const read=(key)=>{const value=Number.parseFloat(style[key]);return Number.isFinite(value)?Math.max(0,Math.min(value,500)):fallback};return{top:read('paddingTop'),right:read('paddingRight'),bottom:read('paddingBottom'),left:read('paddingLeft')}};const report=()=>{const element=root();const pageMargins=margins();const height=Array.from(document.body.children).reduce((max,child)=>Math.max(max,child.getBoundingClientRect().bottom+window.scrollY),1123);const contentHeight=element?Math.max(0,element.scrollHeight-pageMargins.top-pageMargins.bottom):height;parent.postMessage({type:'resume-preview-height',height,contentHeight,margins:pageMargins},'*')};const print=()=>{const pageMargins=margins();const style=document.getElementById('resume-print-page');if(style){const px=(value)=>Number(value.toFixed(2))+'px';style.textContent='@page{size:A4;margin:'+px(pageMargins.top)+' '+px(pageMargins.right)+' '+px(pageMargins.bottom)+' '+px(pageMargins.left)+'}';requestAnimationFrame(()=>window.print())}else window.print()};window.addEventListener('message',event=>{if(event.data?.type==='resume-print')print()});new ResizeObserver(report).observe(document.body);const element=root();if(element)new ResizeObserver(report).observe(element);window.addEventListener('load',report);if(document.fonts?.ready)document.fonts.ready.then(report);report()})()</script>`
    : ''

  const printPageStyle =
    mode === 'print'
      ? '<style id="resume-print-page">@page{size:A4;margin:8mm}</style>'
      : ''

  return `<!doctype html><html><head><meta charset="utf-8"><style>${document.css}</style>${printStyles}${printPageStyle}</head><body>${document.html}${heightReporter}</body></html>`
}
