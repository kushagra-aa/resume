export type TemplateData = Record<string, unknown>

export type TemplateControl = {
  key: string
  label: string
  type: 'select' | 'range' | 'color'
  variable: string
  options?: Array<{ label: string; value: string }>
  min?: number
  max?: number
  step?: number
  unit?: string
  defaultValue: string | number
}

export type ResumeTemplate = {
  id: string
  name: string
  description: string
  version: string
  controls: TemplateControl[]
  html: string
  css: string
  defaults: TemplateData
}
