import { describe, expect, it } from 'vitest'

import {
  createTemplatePackage,
  createResumePackage,
  importTemplatePackage,
  readResumePackage,
} from '#/features/resume/source-package'
import type { CustomTemplate } from '#/features/templates/template-types'

describe('resume source packages', () => {
  it('round-trips the exact source files and manifest', () => {
    const document = {
      id: 'resume-1',
      name: 'My Resume',
      html: '<main>Exact HTML</main>\n',
      css: 'main { color: red; }\n',
      createdAt: '2026-09-30T00:00:00.000Z',
      updatedAt: '2026-09-30T00:00:00.000Z',
    }
    const entries = readResumePackage(createResumePackage(document))

    expect(new TextDecoder().decode(entries.get('resume.html'))).toBe(
      document.html,
    )
    expect(new TextDecoder().decode(entries.get('resume.css'))).toBe(
      document.css,
    )
    expect(
      JSON.parse(new TextDecoder().decode(entries.get('manifest.json'))),
    ).toEqual({
      format: 'resume-source-package',
      packageVersion: 1,
      name: document.name,
    })
  })

  it('rejects malformed ZIP input', () => {
    expect(() => readResumePackage(new Uint8Array([1, 2, 3]))).toThrow(
      'valid ZIP file',
    )
  })

  it('round-trips custom template metadata and source into a new identity', async () => {
    const template: CustomTemplate = {
      id: 'custom-123e4567-e89b-42d3-a456-426614174000',
      name: 'Custom Modern',
      description: 'A modified two-column layout',
      version: '1.0.0',
      schemaVersion: 1,
      sourceTemplateId: 'modern',
      controls: [
        {
          key: 'accent',
          label: 'Accent color',
          type: 'color',
          variable: '--resume-accent',
          defaultValue: '#123456',
        },
      ],
      html: '<main>{{name}}</main>',
      css: '.resume { color: var(--resume-accent); }',
      defaults: { name: 'Sample Name' },
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-02T00:00:00.000Z',
    }
    const bytes = createTemplatePackage(template)
    const imported = await importTemplatePackage(
      Object.assign(new Blob([bytes]), { name: 'custom-template.zip' }) as File,
    )

    expect(imported.id).not.toBe(template.id)
    expect(imported.sourceTemplateId).toBeNull()
    expect(imported.name).toBe(template.name)
    expect(imported.controls).toEqual(template.controls)
    expect(imported.html).toBe(template.html)
    expect(imported.css).toBe(template.css)
    expect(imported.defaults).toEqual(template.defaults)
  })

  it('rejects a resume package imported as a template package', async () => {
    const malformed = createResumePackage({
      id: 'source',
      name: 'Not a template package',
      html: '<main></main>',
      css: '',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    })
    await expect(
      importTemplatePackage(
        Object.assign(new Blob([malformed]), { name: 'bad.zip' }) as File,
      ),
    ).rejects.toThrow()
  })
})
