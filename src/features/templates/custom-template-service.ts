import { customTemplateRepository } from '#/db/repositories/custom-template-repository'
import type { CustomTemplate, ResumeTemplate } from './template-types'

export async function duplicateTemplate(source: ResumeTemplate) {
  const now = new Date().toISOString()
  return customTemplateRepository.create({
    ...structuredClone(source),
    id: `custom-${crypto.randomUUID()}`,
    name: `${source.name} Copy`,
    schemaVersion: 1,
    sourceTemplateId: source.id,
    createdAt: now,
    updatedAt: now,
  })
}

export async function renameCustomTemplate(
  template: CustomTemplate,
  name: string,
) {
  const normalizedName = name.trim()
  if (!normalizedName) throw new Error('Enter a template name.')
  return customTemplateRepository.update({
    ...template,
    name: normalizedName,
    updatedAt: new Date().toISOString(),
  })
}
