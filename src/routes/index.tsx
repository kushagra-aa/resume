import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { ResumeDocument } from '#/models/resume'
import { safeParseResumeDocument } from '#/schemas/resume'

export const Route = createFileRoute('/')({ component: Home })

type EditorKind = 'html' | 'css'

const DOCUMENTS_KEY = 'resume:poc:documents'
const ACTIVE_KEY = 'resume:poc:active'

const starterHtml = `<main class="resume">
  <header class="resume-header">
    <div class="identity">
      <h1>Kushagra Agnihotri</h1>
      <p class="role-title">Full-stack Developer</p>
      <p class="summary"><strong>Full-stack developer</strong> with <strong>3.5+ years</strong> of experience building, scaling, and owning production web applications using <strong>React, Node.js, TypeScript, and PostgreSQL.</strong> Strong experience across frontend, backend, APIs, authentication, and serverless architectures. Proven ability to take features from requirements to deployment, working closely with product and non-technical stakeholders in fast-paced environments.</p>
    </div>
    <div class="contact">
      <a href="mailto:kushagraagnihotri24@gmail.com">kushagraagnihotri24@gmail.com <span class="contact-icon">✉</span></a>
      <a href="tel:+918299446479">+91 8299446479 <span class="contact-icon">◧</span></a>
      <a href="https://kushagra-aa.vercel.app">kushagra-aa.vercel.app <span class="contact-icon">↗</span></a>
      <a href="https://linkedin.com/in/kushagra-aa">linkedin.com/in/kushagra-aa <span class="contact-icon">in</span></a>
      <a href="https://github.com/kushagra-aa">github.com/kushagra-aa <span class="contact-icon">●</span></a>
    </div>
  </header>

  <div class="resume-grid">
    <section class="experience-column">
      <h2>Work Experience</h2>
      <article class="role"><h3>JavaScript Developer</h3><p class="company">Solvative</p><div class="role-meta"><em>05/2024 - Present</em><em>Remote</em></div><ul><li>Owned end-to-end development of a full-stack client dashboard using <strong>React, Node.js, and TypeScript</strong>, delivering real-time insights and reducing client reporting overhead by <strong>25%.</strong></li><li>Designed and maintained <strong>backend APIs</strong> using <strong>Hono and Next.js</strong>, implementing authentication, role-based access control, and secure data flows.</li><li>Built and deployed <strong>serverless backends on Cloudflare Workers</strong>, ensuring low-latency performance and high availability.</li><li>Collaborated closely with stakeholders to translate business requirements into scalable technical solutions.</li></ul></article>
      <article class="role"><h3>Software Development Engineer 1</h3><p class="company">UnOrg Vendor Solutions</p><div class="role-meta"><em>12/2022 - 10/2023</em><em>Lucknow</em></div><ul><li>Designed and developed <strong>full-stack vendor management tools</strong> using <strong>React, TypeScript, Node.js, and Django.</strong></li><li>Led dashboard development with <strong>Next.js</strong>, focusing on performance optimization for data visualization and reporting features.</li><li>Worked directly with non-technical stakeholders to refine workflows and deliver business-critical features.</li></ul></article>
      <article class="role"><h3>Junior Programmer</h3><p class="company">Rozgaar India</p><div class="role-meta"><em>06/2022 - 11/2022</em><em>Lucknow</em></div><ul><li>Developed and optimized <strong>backend modules</strong> using <strong>Django and MySQL</strong>, including REST APIs and authentication flows for a sales-warehouse management system.</li><li>Improved system efficiency, contributing to a <strong>40% increase in sales efficiency</strong> and reduced warehousing overhead.</li><li>Built and integrated <strong>third-party APIs and OAuth-based integrators</strong> (Meta, LinkedIn, YouTube, X) for unified analytics and automation.</li></ul></article>
      <article class="role compact"><h3>Web Development Intern</h3><p class="company">Tamasha.live</p><div class="role-meta"><em>12/2021 - 03/2022</em><em>Remote</em></div></article>
      <article class="role compact"><h3>UI Developer Intern</h3><p class="company">TrendAI</p><div class="role-meta"><em>05/2021 - 11/2021</em><em>Remote</em></div></article>
    </section>

    <aside class="details-column">
      <section><h2>Skills</h2><div class="skill-list"><span>Node.js</span><span>ReactJS</span><span>JavaScript</span><span>TypeScript</span><span>Express.js</span><span>HonoJS</span><span>Python</span><span>Next.js</span><span>Shadcn/UI</span><span>Zustand</span><span>PostgreSQL</span><span>MySQL</span><span>MongoDB</span><span>Django</span><span>Supabase</span><span>Cloudflare</span><span>AWS</span><span>Docker</span><span>CI/CD</span><span>Git</span><span>VSCode</span><span>API Design</span><span>REST APIs</span><span>GraphQL</span><span>OAuth</span><span>JWT</span><span>System Design</span><span>Linux</span></div></section>
      <section><h2>Personal Projects</h2><article class="project"><h3>HiredToBe <small>(10/2025 - Present)</small></h3><ul><li>End-to-end <strong>full-stack job tracking platform</strong> built using <strong>React, TypeScript, Hono, and serverless architecture.</strong></li><li>Designed REST APIs, database schema, and frontend UI for managing job applications workflows, and interviews.</li><li>Implemented modern tooling including <strong>monorepo setup, Drizzle ORM, and Cloudflare D1.</strong></li></ul></article><article class="project"><h3>PennyWise <small>(12/2025 - 01/2026)</small></h3><ul><li>Built a <strong>local-first PWA</strong> for personal finance tracking using <strong>SolidJS, TailwindCSS, and Vite.</strong></li><li>Designed offline-first data flows with optional cloud sync, focusing on performance and reliability.</li></ul></article><article class="project"><h3>VS Code Extensions <small>(Wrap It, Dr Text, REMify)</small></h3><ul><li>Designed, built, and published multiple <strong>VS Code extensions</strong> used by developers to improve workflow.</li><li>Focused on performance, UX, and developer productivity.</li><li>Actively maintained with real-world users and feedback.</li><li>Combined <strong>7K+ installs</strong> across extensions.</li></ul></article></section>
      <section class="certifications"><h2>Certifications</h2><h3>Stripe Associate Architect Certification <small>(2025 - 2027)</small></h3><p><em>A Stripe Certified Associate Architect can assess business needs and propose Stripe products and best practices for typical business use cases.</em></p></section>
    </aside>
  </div>
</main>`

const starterCss = `@page { size: A4; margin: 0; }
:root { color: #111; font-family: Arial, Helvetica, sans-serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
* { box-sizing: border-box; }
body { margin: 0; background: #fff; }
.resume { width: 210mm; min-height: 297mm; padding: 8mm; margin: 0 auto; background: #fff; }
.resume-header { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 42%); gap: 6mm; padding-bottom: 4mm; border-bottom: 1.5px solid #344054; }
.identity { display: flex; flex-direction: column; gap: 2mm; }
.portrait-block { width: 9mm; height: 13mm; margin-top: 3px; background: #344054; }
h1 { margin: 0; color: #344054; font-size: 25px; font-weight: 400; line-height: 1.1; }
.role-title { margin: 0; color: #3d9aa3; font-size: 16px; }
.summary { max-width: 112mm; margin: 0; font-size: 10.2px; line-height: 1.34; }
.contact { display: grid; min-width: 0; align-content: start; gap: 2.5mm; padding-top: 2px; text-align: right; font-size: 10.5px; }
.contact a { color: #111; text-decoration: none; overflow-wrap: anywhere; }
.contact-icon { display: inline-grid; width: 15px; margin-left: 8px; place-items: center; color: #344054; font-weight: 700; }
.resume-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); gap: 6mm; }
.experience-column { padding-top: 5mm; }
.details-column { min-width: 0; padding-top: 5mm; }
h2 { margin: 0 0 3.5mm; color: #050505; font-size: 15.5px; font-weight: 800; line-height: 1; text-transform: uppercase; }
.experience-column h2 { margin-bottom: 3.5mm; }
.role { position: relative; min-width: 0; margin: 0 0 5mm; padding-left: 2.5mm; }
.role::before { position: absolute; top: -2px; left: -8mm; width: 4mm; height: 13mm; background: #48a2a9; content: ''; }
.role h3, .project h3, .certifications h3 { margin: 0; color: #080808; font-size: 14px; font-weight: 800; line-height: 1.08; }
.company { margin: 1px 0 3px; font-size: 14px; line-height: 1; }
.role-meta { display: flex; justify-content: space-between; margin-bottom: 3px; color: #3d9aa3; font-size: 10.5px; }
.role ul, .project ul { margin: 0; padding-left: 4mm; }
li { margin: 0 0 2px; font-size: 10.5px; line-height: 1.22; }
li::marker { color: #48a2a9; font-size: 1.1em; }
.role.compact { margin-bottom: 5mm; }
.details-column > section { margin-bottom: 9mm; }
.details-column h2 { margin-bottom: 4mm; }
.skill-list { display: flex; flex-wrap: wrap; gap: 4px 5px; }
.skill-list span { padding: 5px 7px; border-radius: 4px; color: #fff; background: #344054; font-size: 10px; line-height: 1; }
.project { margin-bottom: 5mm; }
.project h3 small, .certifications h3 small { font-size: 10.5px; font-weight: 400; }
.project ul { margin-top: 2px; }
.certifications p { margin: 4px 0 0; color: #777; font-size: 10px; line-height: 1.2; }
@media print { body { margin: 0; } .resume { margin: 0; } .resume-header, .role, .details-column > section { break-inside: avoid; } }
`

function newDocument(name = 'My Resume'): ResumeDocument {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    html: starterHtml,
    css: starterCss,
    createdAt: now,
    updatedAt: now,
  }
}

function isResumeDocument(value: unknown): value is ResumeDocument {
  return safeParseResumeDocument(value).success
}

function migrateBuiltInTemplate(item: ResumeDocument): ResumeDocument {
  if (
    !item.html.includes('Kushagra Agnihotri') ||
    !item.css.includes('grid-template-columns: 51% 46%')
  )
    return item

  const css = item.css
    .replace(
      /grid-template-columns:\s*1fr\s+42%;/,
      'grid-template-columns: minmax(0, 1fr) minmax(0, 42%);',
    )
    .replace(/\s*min-height:\s*40mm;/, '')
    .replace(/padding-bottom:\s*5mm;/, 'padding-bottom: 4mm;')
    .replace(/gap:\s*25px;/, 'gap: 6mm;')
    .replace(
      /grid-template-columns:\s*51%\s+46%;/,
      'grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr);',
    )
    .replace(
      /\.details-column\s*\{\s*padding-top:\s*5mm;\s*\}/,
      '.details-column { min-width: 0; padding-top: 5mm; }',
    )
    .replace(
      /\.role\s*\{\s*position:\s*relative;\s*margin:\s*0 0 5mm;\s*padding-left:\s*0;\s*\}/,
      '.role { position: relative; min-width: 0; margin: 0 0 5mm; padding-left: 2.5mm; border-left: 2mm solid #48a2a9; }',
    )
    .replace(/\.role::before\s*\{[^}]*\}/, '.role::before { display: none; }')
    .replace(
      /\.skill-list span\s*\{[^}]*\}/,
      '.skill-list span { padding: 5px 7px; border: 1px solid #344054; border-radius: 4px; color: #344054; background: #fff; font-size: 10px; line-height: 1; }',
    )
    .replace(
      /\.contact\s*\{([^}]*)\}/,
      (_match, rules: string) =>
        `.contact {${rules.replace('align-content: start;', 'min-width: 0; align-content: start;').replace('gap: 8px;', 'gap: 2.5mm;')}}`,
    )
    .replace(
      /\.contact a\s*\{([^}]*)\}/,
      (_match, rules: string) =>
        `.contact a {${rules.replace('white-space: nowrap;', 'overflow-wrap: anywhere;')}}`,
    )

  return {
    ...item,
    css: `${css}\n@media print { :root { -webkit-print-color-adjust: exact; print-color-adjust: exact; } body { margin: 0; } .resume { margin: 0; } .resume-header, .role, .details-column > section { break-inside: avoid; } }`,
  }
}

function readDocuments(): ResumeDocument[] {
  if (typeof window === 'undefined') return [newDocument()]
  try {
    const stored = window.localStorage.getItem(DOCUMENTS_KEY)
    const parsed = stored ? JSON.parse(stored) : null
    if (Array.isArray(parsed)) {
      const valid = parsed.filter(isResumeDocument)
      if (valid.length) return valid.map(migrateBuiltInTemplate)
    }
    const legacy = window.localStorage.getItem('resume:poc:document')
    const legacyDocument = legacy ? JSON.parse(legacy) : null
    if (isResumeDocument(legacyDocument))
      return [migrateBuiltInTemplate(legacyDocument)]
  } catch {
    // Start clean when local data is malformed.
  }
  return [newDocument()]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightSource(source: string, kind: EditorKind) {
  const pattern =
    kind === 'html'
      ? /(<!--[\s\S]*?-->|<\/?[a-z][^>]*>|"[^"\n]*"|'[^'\n]*')/gi
      : /(\/\*[\s\S]*?\*\/|"[^"\n]*"|'[^'\n]*'|#[0-9a-f]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|mm|%|vh|vw)?\b)/gi
  return source
    .split(pattern)
    .map((part, index) => {
      if (!part) return ''
      const escaped = escapeHtml(part)
      const isToken = index % 2 === 1
      return isToken ? `<span class="syntax-token">${escaped}</span>` : escaped
    })
    .join('')
}

function validateSource(source: string, kind: EditorKind): string[] {
  const errors: string[] = []
  if (kind === 'html' && typeof window !== 'undefined') {
    const parsed = new DOMParser().parseFromString(source, 'text/html')
    if (parsed.querySelector('parsererror'))
      errors.push('HTML could not be parsed.')
  }
  let balance = 0
  for (const character of source) {
    if (character === '{') balance += 1
    if (character === '}') balance -= 1
    if (balance < 0) break
  }
  if (kind === 'css' && balance !== 0) errors.push('CSS braces are unbalanced.')
  if (
    kind === 'html' &&
    (source.match(/</g) ?? []).length !== (source.match(/>/g) ?? []).length
  )
    errors.push('HTML tags appear to be incomplete.')
  return errors
}

function CodeEditor({
  kind,
  value,
  onChange,
}: {
  kind: EditorKind
  value: string
  onChange: (value: string) => void
}) {
  const highlightRef = useRef<HTMLPreElement>(null)
  const errors = useMemo(() => validateSource(value, kind), [kind, value])
  function syncScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = event.currentTarget.scrollTop
      highlightRef.current.scrollLeft = event.currentTarget.scrollLeft
    }
  }
  return (
    <>
      <div className="code-editor">
        <pre
          ref={highlightRef}
          className="code-highlight"
          aria-hidden="true"
          dangerouslySetInnerHTML={{
            __html: `${highlightSource(value, kind)}\n`,
          }}
        />
        <textarea
          className="source-editor"
          spellCheck={false}
          value={value}
          onScroll={syncScroll}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <div
        className={
          errors.length ? 'editor-validation invalid' : 'editor-validation'
        }
      >
        {errors.length ? errors.join(' ') : `${kind.toUpperCase()} looks valid`}
      </div>
    </>
  )
}

function Home() {
  const [documents, setDocuments] = useState<ResumeDocument[]>(readDocuments)
  const [activeId, setActiveId] = useState('')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [activeEditor, setActiveEditor] = useState<EditorKind>('html')
  const [zoom, setZoom] = useState(0.8)
  const [previewHeight, setPreviewHeight] = useState(1123)
  const [stageWidth, setStageWidth] = useState(720)
  const previewRef = useRef<HTMLIFrameElement>(null)
  const previewStageRef = useRef<HTMLDivElement>(null)
  const resume = documents.find((item) => item.id === activeId) ?? documents[0]
  const pageCount = Math.max(1, Math.ceil(previewHeight / 1123))
  const fittedZoom = Math.min(zoom, Math.max(0.35, stageWidth / 794))

  useEffect(() => {
    if (!activeId && resume) {
      setActiveId(window.localStorage.getItem(ACTIVE_KEY) ?? resume.id)
      return
    }
    const timeout = window.setTimeout(() => {
      const updated = documents.map((item) =>
        item.id === resume?.id
          ? { ...item, updatedAt: new Date().toISOString() }
          : item,
      )
      window.localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updated))
      window.localStorage.setItem(ACTIVE_KEY, resume?.id ?? '')
      setSavedAt(new Date())
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [activeId, documents, resume?.id])

  useEffect(() => {
    const stage = previewStageRef.current
    if (!stage) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setStageWidth(entry.contentRect.width)
    })
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onPreviewMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== previewRef.current?.contentWindow) return
      if (!event.data || typeof event.data !== 'object') return
      const data = event.data as { type?: unknown; height?: unknown }
      if (
        data.type !== 'resume-preview-height' ||
        typeof data.height !== 'number' ||
        !Number.isFinite(data.height)
      )
        return
      setPreviewHeight(Math.max(1123, Math.min(data.height, 20000)))
    }
    window.addEventListener('message', onPreviewMessage)
    return () => window.removeEventListener('message', onPreviewMessage)
  }, [])

  useEffect(
    () => setPreviewHeight(1123),
    [resume?.id, resume?.html, resume?.css],
  )

  const preview = useMemo(
    () =>
      resume
        ? `<!doctype html><html><head><meta charset="utf-8"><style>${resume.css}</style></head><body>${resume.html}<script>(()=>{const report=()=>{const height=Array.from(document.body.children).reduce((max,element)=>Math.max(max,element.getBoundingClientRect().bottom+window.scrollY),1123);parent.postMessage({type:'resume-preview-height',height},'*')};new ResizeObserver(report).observe(document.body);window.addEventListener('load',report);report()})()</script></body></html>`
        : '',
    [resume],
  )

  function update(field: 'html' | 'css' | 'name', value: string) {
    setDocuments((current) =>
      current.map((item) =>
        item.id === resume?.id ? { ...item, [field]: value } : item,
      ),
    )
  }
  function createResume() {
    const created = newDocument(`Resume ${documents.length + 1}`)
    setDocuments((current) => [...current, created])
    setActiveId(created.id)
  }
  function deleteResume() {
    if (!resume || !window.confirm(`Delete “${resume.name}”?`)) return
    const remaining = documents.filter((item) => item.id !== resume.id)
    if (remaining.length) {
      setDocuments(remaining)
      setActiveId(remaining[0].id)
    } else {
      const replacement = newDocument()
      setDocuments([replacement])
      setActiveId(replacement.id)
    }
  }
  function resetResume() {
    if (resume && window.confirm('Reset this resume to the starter content?'))
      setDocuments((current) =>
        current.map((item) =>
          item.id === resume.id
            ? { ...newDocument(item.name), id: item.id }
            : item,
        ),
      )
  }
  function exportSource(extension: 'html' | 'css') {
    if (!resume) return
    const content = extension === 'html' ? resume.html : resume.css
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `${resume.name.toLowerCase().replace(/\s+/g, '-')}.${extension}`
    link.click()
    URL.revokeObjectURL(url)
  }
  function printResume() {
    if (!resume) return
    const printFrame = window.document.createElement('iframe')
    printFrame.title = 'Resume print document'
    printFrame.setAttribute('sandbox', 'allow-same-origin allow-modals')
    printFrame.style.cssText =
      'position:fixed;width:0;height:0;border:0;right:0;bottom:0;visibility:hidden'
    let cleanedUp = false
    const cleanup = () => {
      if (cleanedUp) return
      cleanedUp = true
      printFrame.remove()
    }
    printFrame.addEventListener(
      'load',
      () => {
        const printWindow = printFrame.contentWindow
        if (!printWindow) return cleanup()
        printWindow.addEventListener('afterprint', cleanup, { once: true })
        printWindow.focus()
        printWindow.print()
      },
      { once: true },
    )
    printFrame.srcdoc = preview
    window.document.body.append(printFrame)
    window.setTimeout(cleanup, 60_000)
  }
  if (!resume) return null

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <span className="brand-mark">R</span>
          <div>
            <p className="brand-name">ResuMe</p>
            <p className="brand-caption">Your work, in your words.</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="save-status">
            <span className="status-dot" />
            {savedAt
              ? `Saved ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Ready'}
          </span>
          <button className="button button-quiet" onClick={resetResume}>
            Reset
          </button>
          <button
            className="button button-secondary"
            onClick={() => exportSource('html')}
          >
            Export HTML
          </button>
          <button className="button button-primary" onClick={printResume}>
            Print / PDF
          </button>
        </div>
      </header>
      <section className="workspace" aria-label="Resume workspace">
        <aside className="editor-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Workspace</p>
              <input
                className="resume-name"
                value={resume.name}
                aria-label="Resume name"
                onChange={(event) => update('name', event.target.value)}
              />
            </div>
            <button className="export-link" onClick={() => exportSource('css')}>
              Export CSS
            </button>
          </div>
          <div className="resume-list" aria-label="Saved resumes">
            {documents.map((item) => (
              <button
                key={item.id}
                className={
                  item.id === resume.id
                    ? 'resume-list-item active'
                    : 'resume-list-item'
                }
                onClick={() => setActiveId(item.id)}
              >
                {item.name}
              </button>
            ))}
            <button className="new-resume" onClick={createResume}>
              + New resume
            </button>
          </div>
          <div
            className="editor-tabs"
            role="tablist"
            aria-label="Source editors"
          >
            <button
              className={
                activeEditor === 'html' ? 'editor-tab active' : 'editor-tab'
              }
              onClick={() => setActiveEditor('html')}
              role="tab"
              aria-selected={activeEditor === 'html'}
            >
              HTML
            </button>
            <button
              className={
                activeEditor === 'css' ? 'editor-tab active' : 'editor-tab'
              }
              onClick={() => setActiveEditor('css')}
              role="tab"
              aria-selected={activeEditor === 'css'}
            >
              CSS
            </button>
          </div>
          <div className="editor-wrap">
            <label htmlFor="source-editor" className="sr-only">
              {activeEditor.toUpperCase()} source
            </label>
            <CodeEditor
              kind={activeEditor}
              value={resume[activeEditor]}
              onChange={(value) => update(activeEditor, value)}
            />
          </div>
          <div className="editor-footer">
            <p className="editor-hint">
              Edit source directly. Changes save locally.
            </p>
            <button className="delete-link" onClick={deleteResume}>
              Delete resume
            </button>
          </div>
        </aside>
        <section className="preview-panel">
          <div className="preview-heading">
            <div>
              <p className="panel-kicker">Live preview</p>
              <h1>Paper view</h1>
            </div>
            <div className="preview-controls">
              <span className="page-label">
                A4 · {pageCount} {pageCount === 1 ? 'page' : 'pages'}
              </span>
              <button
                className="zoom-button"
                onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}
                aria-label="Zoom out"
              >
                −
              </button>
              <span className="zoom-value">{Math.round(zoom * 100)}%</span>
              <button
                className="zoom-button"
                onClick={() => setZoom((value) => Math.min(1.2, value + 0.1))}
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
          </div>
          <div
            className="preview-stage"
            ref={previewStageRef}
            style={{ '--page-count': pageCount } as React.CSSProperties}
          >
            <div
              className="resume-frame-shell"
              style={{
                width: `${210 * fittedZoom}mm`,
                height: `${297 * pageCount * fittedZoom}mm`,
              }}
            >
              <iframe
                ref={previewRef}
                title="Resume preview"
                className="resume-frame"
                style={{
                  height: `${297 * pageCount}mm`,
                  transform: `scale(${fittedZoom})`,
                }}
                sandbox="allow-scripts"
                srcDoc={preview}
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}
