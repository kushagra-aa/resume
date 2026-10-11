import type { ContactLink } from '#/models/profile'

const legacyLinks = [
  { key: 'website', label: 'Website' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
] as const

export function migrateProfileRecord(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const record = value as Record<string, unknown>
  if (record.schemaVersion === 2) return record
  if (record.schemaVersion !== 1) return value

  const personal = record.personal
  const links: ContactLink[] =
    personal && typeof personal === 'object'
      ? legacyLinks.flatMap(({ key, label }) => {
          const url = (personal as Record<string, unknown>)[key]
          return typeof url === 'string' && url.trim()
            ? [{ id: `legacy-${key}-${String(record.id)}`, label, url }]
            : []
        })
      : []

  return { ...record, schemaVersion: 2, links }
}
