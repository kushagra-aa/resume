import { profileRepository } from '#/db/repositories/profile-repository'
import { structuredResumeRepository } from '#/db/repositories/structured-resume-repository'
import type { Profile } from '#/models/profile'
import type { ResumeDocument } from '#/models/resume'
import type {
  ProfileSectionKey,
  StructuredResume,
} from '#/models/structured-resume'

import { renderTemplate } from '../templates/template-renderer'
import { loadTemplates } from '../templates/template-service'
import type { ResumeTemplate, TemplateData } from '../templates/template-types'

export type StructuredTemplateData = TemplateData & {
  sectionVisibility: Record<ProfileSectionKey, boolean>
}

function isSelected(
  selection: StructuredResume['selection'],
  section: ProfileSectionKey,
  id?: string,
) {
  if (!selection.sections[section]) return false
  if (!id) return true
  return selection.items[section]?.[id] !== false
}

function selectedBullets(
  values: string[],
  selection: Record<string, boolean> | undefined,
  parentId: string,
) {
  return values.flatMap((value, index) => {
    const bulletId = `${parentId}-bullet-${index}`
    return selection?.[bulletId] === false ? [] : [{ value }]
  })
}

function formatDate(start: string, end: string, current = false) {
  return [start, current ? 'Present' : end].filter(Boolean).join(' – ')
}

export function createStructuredTemplateData(
  profile: Profile,
  resume: StructuredResume,
): StructuredTemplateData {
  const { selection } = resume
  const selected = (section: ProfileSectionKey, id?: string) =>
    isSelected(selection, section, id)
  const sectionVisibility = {
    personal:
      selected('personal') &&
      Object.values(profile.personal).some((value) => value.trim().length > 0),
    summary: selected('summary') && profile.summary.trim().length > 0,
    experience:
      selected('experience') &&
      profile.experience.some((item) => selected('experience', item.id)),
    education:
      selected('education') &&
      profile.education.some((item) => selected('education', item.id)),
    skills:
      selected('skills') &&
      profile.skills.some(
        (group) => selected('skills', group.id) && group.skills.length > 0,
      ),
    projects:
      selected('projects') &&
      profile.projects.some((item) => selected('projects', item.id)),
    certifications:
      selected('certifications') &&
      profile.certifications.some((item) =>
        selected('certifications', item.id),
      ),
    awards:
      selected('awards') &&
      profile.awards.some((item) => selected('awards', item.id)),
    publications:
      selected('publications') &&
      profile.publications.some((item) => selected('publications', item.id)),
    customSections:
      selected('customSections') &&
      profile.customSections.some((item) =>
        selected('customSections', item.id),
      ),
  }

  return {
    name: selected('personal') ? profile.personal.fullName : '',
    title: selected('personal') ? profile.personal.headline : '',
    email: selected('personal') ? profile.personal.email : '',
    phone: selected('personal') ? profile.personal.phone : '',
    location: selected('personal') ? profile.personal.location : '',
    website: selected('personal') ? profile.personal.website : '',
    linkedin: selected('personal') ? profile.personal.linkedin : '',
    github: selected('personal') ? profile.personal.github : '',
    summary: selected('summary') ? profile.summary : '',
    sectionTitles: Object.fromEntries(
      [
        'summary',
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
        'awards',
        'publications',
        'customSections',
      ].map((key) => [
        key,
        resume.customization.sectionTitles[key as ProfileSectionKey] ||
          (
            {
              summary: 'Profile',
              experience: 'Experience',
              education: 'Education',
              skills: 'Skills',
              projects: 'Projects',
              certifications: 'Certifications',
              awards: 'Awards',
              publications: 'Publications',
              customSections: 'Additional',
            } as Record<string, string>
          )[key],
      ]),
    ),
    sectionVisibility,
    experience: selected('experience')
      ? profile.experience
          .filter((item) => selected('experience', item.id))
          .map((item) => ({
            ...item,
            dates: formatDate(item.startDate, item.endDate, item.current),
            bullets: selectedBullets(
              item.bullets,
              selection.bullets.experience[item.id],
              item.id,
            ),
          }))
      : [],
    education: selected('education')
      ? profile.education
          .filter((item) => selected('education', item.id))
          .map((item) => ({
            ...item,
            dates: formatDate(item.startDate, item.endDate),
          }))
      : [],
    skills: selected('skills')
      ? profile.skills
          .filter((group) => selected('skills', group.id))
          .flatMap((group) =>
            group.skills.map((value) => ({ value, group: group.name })),
          )
      : [],
    projects: selected('projects')
      ? profile.projects
          .filter((item) => selected('projects', item.id))
          .map((item) => ({
            ...item,
            dates: '',
            bullets: selectedBullets(
              item.bullets,
              selection.bullets.projects[item.id],
              item.id,
            ),
          }))
      : [],
    certifications: selected('certifications')
      ? profile.certifications.filter((item) =>
          selected('certifications', item.id),
        )
      : [],
    awards: selected('awards')
      ? profile.awards.filter((item) => selected('awards', item.id))
      : [],
    publications: selected('publications')
      ? profile.publications.filter((item) => selected('publications', item.id))
      : [],
    customSections: selected('customSections')
      ? profile.customSections.filter((item) =>
          selected('customSections', item.id),
        )
      : [],
  }
}

function applyTemplateConfiguration(
  css: string,
  configuration: Record<string, string | number | boolean>,
) {
  const declarations = Object.entries(configuration).flatMap(([key, value]) => {
    if (!/^[a-z][a-z0-9-]*$/i.test(key)) return []
    const safeValue = String(value).replace(/[{};<>]/g, '')
    return [`--resume-${key}: ${safeValue};`]
  })
  return declarations.length
    ? `:root { ${declarations.join(' ')} }\n${css}`
    : css
}

export function renderStructuredResume(
  profile: Profile,
  resume: StructuredResume,
  template: ResumeTemplate,
): ResumeDocument {
  const data = createStructuredTemplateData(profile, resume)
  return {
    id: resume.id,
    name: resume.name,
    html: renderTemplate(template.html, data),
    css: applyTemplateConfiguration(template.css, resume.templateConfiguration),
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  }
}

export async function loadStructuredResumeDocument(id: string) {
  const resume = await structuredResumeRepository.get(id)
  if (!resume) return null
  const [profile, templates] = await Promise.all([
    profileRepository.get(resume.profileId),
    loadTemplates(),
  ])
  if (!profile)
    throw new Error('The profile linked to this resume is unavailable.')
  const template = templates.find((item) => item.id === resume.templateId)
  if (!template) throw new Error('The resume template is unavailable.')
  return renderStructuredResume(profile, resume, template)
}
