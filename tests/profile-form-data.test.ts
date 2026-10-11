import { describe, expect, it } from 'vitest'

import {
  inferContactLink,
  safeContactHref,
} from '#/features/profiles/contact-links'
import { migrateProfileRecord } from '#/features/profiles/profile-migration'
import { splitTokens } from '#/features/profiles/components/token-input'
import { completeProfileFixture } from './fixtures/structured-render-fixtures'

describe('profile form data helpers', () => {
  it('splits pasted comma-separated values without retaining empty tokens', () => {
    expect(splitTokens(' TypeScript, React,,  CSS ')).toEqual([
      'TypeScript',
      'React',
      'CSS',
    ])
  })

  it('recognizes common contact sites and safely normalizes web URLs', () => {
    expect(inferContactLink('', 'https://github.com/example').icon).toBe(
      'github',
    )
    expect(safeContactHref('linkedin.com/in/example')).toBe(
      'https://linkedin.com/in/example',
    )
    expect(safeContactHref('javascript:alert(1)')).toBe('')
  })

  it('migrates v1 links idempotently and retains existing profile data', () => {
    const legacy = structuredClone(completeProfileFixture) as Record<
      string,
      unknown
    >
    legacy.schemaVersion = 1
    delete legacy.links

    const migrated = migrateProfileRecord(
      legacy,
    ) as typeof completeProfileFixture
    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.id).toBe(legacy.id)
    expect(migrated.personal).toEqual(legacy.personal)
    expect(migrated.links).toEqual([
      {
        id: `legacy-website-${legacy.id}`,
        label: 'Website',
        url: 'morgan.example.test',
      },
      {
        id: `legacy-linkedin-${legacy.id}`,
        label: 'LinkedIn',
        url: 'linkedin.com/in/morgan',
      },
      {
        id: `legacy-github-${legacy.id}`,
        label: 'GitHub',
        url: 'github.com/morgan',
      },
    ])
    expect(migrateProfileRecord(migrated)).toEqual(migrated)
  })
})
