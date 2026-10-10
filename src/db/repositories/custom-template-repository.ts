import type { CustomTemplate } from '#/features/templates/template-types'
import {
  parseCustomTemplate,
  safeParseCustomTemplate,
} from '#/schemas/custom-template'

import { resumeDatabase } from '../client'

function assertStorageAvailable() {
  if (typeof indexedDB === 'undefined') {
    throw new Error('Template storage is unavailable in this environment.')
  }
}

const clone = (template: CustomTemplate) => structuredClone(template)

export const customTemplateRepository = {
  async create(template: CustomTemplate) {
    assertStorageAvailable()
    const valid = parseCustomTemplate(template)
    await resumeDatabase.customTemplates.add(valid)
    return clone(valid)
  },

  async get(id: string): Promise<CustomTemplate | null> {
    assertStorageAvailable()
    const parsed = safeParseCustomTemplate(
      await resumeDatabase.customTemplates.get(id),
    )
    return parsed.success ? clone(parsed.data) : null
  },

  async list(): Promise<CustomTemplate[]> {
    assertStorageAvailable()
    const records = await resumeDatabase.customTemplates
      .orderBy('updatedAt')
      .reverse()
      .toArray()
    return records.flatMap((record) => {
      const parsed = safeParseCustomTemplate(record)
      return parsed.success ? [clone(parsed.data)] : []
    })
  },

  async update(template: CustomTemplate) {
    assertStorageAvailable()
    const valid = parseCustomTemplate(template)
    const updated = await resumeDatabase.customTemplates.update(valid.id, valid)
    if (!updated) throw new Error(`Custom template not found: ${valid.id}`)
    return clone(valid)
  },

  async delete(id: string) {
    assertStorageAvailable()
    await resumeDatabase.customTemplates.delete(id)
  },
}
