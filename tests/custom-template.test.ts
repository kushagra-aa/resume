import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { resumeDatabase } from '#/db/client'
import { customTemplateRepository } from '#/db/repositories/custom-template-repository'
import { duplicateTemplate } from '#/features/templates/custom-template-service'
import { completeTemplateFixture } from './fixtures/structured-render-fixtures'

describe('custom template persistence', () => {
  beforeEach(async () => {
    await resumeDatabase.customTemplates.clear()
  })

  it('duplicates a template into an independent global custom template', async () => {
    const originalHtml = completeTemplateFixture.html
    const custom = await duplicateTemplate(completeTemplateFixture)

    expect(custom.id).toMatch(/^custom-/)
    expect(custom.sourceTemplateId).toBe(completeTemplateFixture.id)
    expect(custom.name).toBe('Fixture Copy')
    expect(await customTemplateRepository.get(custom.id)).toEqual(custom)

    custom.html = '<main>Custom source only</main>'
    const saved = await customTemplateRepository.update(custom)
    expect(saved.html).toContain('Custom source only')
    expect(completeTemplateFixture.html).toBe(originalHtml)
    expect(await customTemplateRepository.list()).toHaveLength(1)
  })

  it('renames and deletes custom templates from local storage', async () => {
    const custom = await duplicateTemplate(completeTemplateFixture)
    const renamed = { ...custom, name: 'My Template' }
    await customTemplateRepository.update(renamed)

    expect((await customTemplateRepository.get(custom.id))?.name).toBe(
      'My Template',
    )
    await customTemplateRepository.delete(custom.id)
    expect(await customTemplateRepository.get(custom.id)).toBeNull()
  })
})
