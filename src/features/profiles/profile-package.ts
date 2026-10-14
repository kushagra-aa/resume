import { z } from 'zod'

import type { Profile } from '#/models/profile'
import { parseProfile } from '#/schemas/profile'

const profilePackageSchema = z.object({
  format: z.literal('resume-profile'),
  version: z.literal(1),
  profile: z.unknown(),
})

const MAX_PROFILE_PACKAGE_BYTES = 5 * 1024 * 1024

export function exportProfilePackage(profile: Profile) {
  return JSON.stringify(
    { format: 'resume-profile', version: 1, profile },
    null,
    2,
  )
}

export async function importProfilePackage(file: File): Promise<Profile> {
  if (file.size > MAX_PROFILE_PACKAGE_BYTES) {
    throw new Error('Profile package is too large (maximum 5 MB).')
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(await file.text())
  } catch {
    throw new Error('This file is not valid JSON.')
  }

  const packageResult = profilePackageSchema.safeParse(parsedJson)
  if (!packageResult.success) {
    throw new Error('This file is not a supported ResuMe profile package.')
  }

  const profile = parseProfile(packageResult.data.profile)
  const now = new Date().toISOString()
  return { ...profile, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
}
