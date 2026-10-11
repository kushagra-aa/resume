import type { Profile } from '#/models/profile'
import type {
  ProfileSectionKey,
  StructuredResume,
} from '#/models/structured-resume'

const profileSections: ProfileSectionKey[] = [
  'personal',
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'awards',
  'publications',
  'customSections',
]

export function createStructuredResume(
  profile: Profile,
  templateId: string,
  name = `${profile.name} Resume`,
): StructuredResume {
  const now = new Date().toISOString()
  const itemIds: Partial<Record<ProfileSectionKey, string[]>> = {
    personal: [
      ...Object.keys(profile.personal),
      ...profile.links.map((link) => `link:${link.id}`),
    ],
    experience: profile.experience.map((item) => item.id),
    education: profile.education.map((item) => item.id),
    skills: profile.skills.flatMap((group) => [
      group.id,
      ...group.skills.map((_, index) => `${group.id}:skill:${index}`),
    ]),
    projects: profile.projects.map((item) => item.id),
    certifications: profile.certifications.map((item) => item.id),
    awards: profile.awards.map((item) => item.id),
    publications: profile.publications.map((item) => item.id),
    customSections: profile.customSections.flatMap((section) => [
      section.id,
      ...section.items.map((item) => `${section.id}:${item.id}`),
    ]),
  }

  return {
    id: crypto.randomUUID(),
    name,
    schemaVersion: 1,
    profileId: profile.id,
    templateId,
    selection: {
      sections: Object.fromEntries(
        profileSections.map((key) => [key, true]),
      ) as Record<ProfileSectionKey, boolean>,
      items: Object.fromEntries(
        Object.entries(itemIds).map(([key, ids]) => [
          key,
          Object.fromEntries((ids ?? []).map((id) => [id, true])),
        ]),
      ),
      bullets: {
        experience: Object.fromEntries(
          profile.experience.map((item) => [
            item.id,
            Object.fromEntries(
              item.bullets.map((_, index) => [
                `${item.id}-bullet-${index}`,
                true,
              ]),
            ),
          ]),
        ),
        projects: Object.fromEntries(
          profile.projects.map((item) => [
            item.id,
            Object.fromEntries(
              item.bullets.map((_, index) => [
                `${item.id}-bullet-${index}`,
                true,
              ]),
            ),
          ]),
        ),
      },
    },
    templateConfiguration: {},
    customization: { sectionTitles: {} },
    createdAt: now,
    updatedAt: now,
  }
}
