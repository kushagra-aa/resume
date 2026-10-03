import type { TemplateData } from './template-types'

function getValue(data: TemplateData, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined
    return (current as Record<string, unknown>)[key]
  }, data)
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderSections(source: string, data: TemplateData): string {
  const sectionPattern = /{{#([\w.]+)}}([\s\S]*?){{\/\1}}/g
  const withSections = source.replace(
    sectionPattern,
    (_match, path: string, body: string) => {
      const value = getValue(data, path)
      if (Array.isArray(value))
        return value
          .map((item) =>
            renderSections(body, {
              ...data,
              ...(item && typeof item === 'object' ? item : { value: item }),
            }),
          )
          .join('')
      return value ? renderSections(body, data) : ''
    },
  )

  return withSections.replace(
    /{{{([\w.]+)}}}|{{([\w.]+)}}/g,
    (_match, rawPath, escapedPath) =>
      rawPath
        ? String(getValue(data, rawPath) ?? '')
        : escapeHtml(getValue(data, escapedPath)),
  )
}

export function renderTemplate(source: string, data: TemplateData) {
  return renderSections(source, data)
}
