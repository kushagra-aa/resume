export type TemplateData = Record<string, unknown>

export type ResumeTemplate = {
  id: string
  name: string
  description: string
  version: string
  html: string
  css: string
  defaults: TemplateData
}
