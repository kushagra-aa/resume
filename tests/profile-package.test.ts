import { describe, expect, it } from 'vitest'

import {
  exportProfilePackage,
  importProfilePackage,
} from '#/features/profiles/profile-package'
import { completeProfileFixture } from './fixtures/structured-render-fixtures'

function jsonFile(value: string, size = value.length) {
  return { size, text: async () => value } as File
}

describe('profile JSON packages', () => {
  it('round-trips valid profile data as an independent profile', async () => {
    const source = structuredClone(completeProfileFixture)
    const imported = await importProfilePackage(
      jsonFile(exportProfilePackage(source)),
    )

    expect(imported.id).not.toBe(source.id)
    expect(imported.name).toBe(source.name)
    expect(imported.experience).toEqual(source.experience)
    expect(imported.createdAt).not.toBe(source.createdAt)
  })

  it('rejects unknown package versions and invalid profile shapes', async () => {
    await expect(
      importProfilePackage(
        jsonFile(JSON.stringify({ format: 'resume-profile', version: 2 })),
      ),
    ).rejects.toThrow('not a supported')

    await expect(
      importProfilePackage(
        jsonFile(
          JSON.stringify({
            format: 'resume-profile',
            version: 1,
            profile: { schemaVersion: 2 },
          }),
        ),
      ),
    ).rejects.toThrow()
  })

  it('rejects invalid JSON and oversized files', async () => {
    await expect(importProfilePackage(jsonFile('{'))).rejects.toThrow(
      'not valid JSON',
    )
    await expect(
      importProfilePackage(jsonFile('{}', 5 * 1024 * 1024 + 1)),
    ).rejects.toThrow('too large')
  })
})
