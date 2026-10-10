import { z } from 'zod'

import type { ResumeTemplate, TemplateData } from './template-types'

const templateMetadataSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  version: z.string().min(1),
  controls: z.array(
    z.object({
      key: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
      label: z.string().min(1),
      type: z.enum(['select', 'range', 'color']),
      variable: z.string().regex(/^--resume-[a-z][a-z0-9-]*$/),
      options: z
        .array(z.object({ label: z.string(), value: z.string() }))
        .optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().optional(),
      unit: z.string().optional(),
      defaultValue: z.union([z.string(), z.number()]),
    }),
  ),
})

const templateDefinitions = [
  { id: 'classic', path: '/templates/classic' },
  { id: 'modern', path: '/templates/modern' },
  { id: 'minimal', path: '/templates/minimal' },
] as const

async function readJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Could not load template asset: ${path}`)
  return response.json() as Promise<T>
}

async function loadTemplate(definition: (typeof templateDefinitions)[number]) {
  const [metadata, html, css, defaults] = await Promise.all([
    readJson<unknown>(`${definition.path}/template.json`),
    fetch(`${definition.path}/resume.html`).then((response) => response.text()),
    fetch(`${definition.path}/resume.css`).then((response) => response.text()),
    readJson<TemplateData>(`${definition.path}/defaults.json`),
  ])
  const parsedMetadata = templateMetadataSchema.parse(metadata)
  return { ...parsedMetadata, html, css, defaults } satisfies ResumeTemplate
}

export function loadTemplates() {
  return Promise.all(templateDefinitions.map(loadTemplate))
}
