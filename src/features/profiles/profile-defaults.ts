import type { Profile } from '#/models/profile'

export function createEmptyProfile(name = 'My Profile'): Profile {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    schemaVersion: 1,
    personal: {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    awards: [],
    publications: [],
    customSections: [],
    createdAt: now,
    updatedAt: now,
  }
}
