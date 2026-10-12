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
import {
  inferContactLink,
  linkForTemplate,
  safeContactHref,
} from '#/features/profiles/contact-links'

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
    return selection?.[bulletId] === false || !value.trim()
      ? []
      : [{ value: value.trim() }]
  })
}

function hasText(...values: Array<string | undefined>) {
  return values.some((value) => Boolean(value?.trim()))
}

function joinText(...values: Array<string | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' · ')
}

function hasAnyText(record: Record<string, unknown>) {
  return Object.entries(record).some(
    ([key, value]) =>
      key !== 'id' && typeof value === 'string' && value.trim().length > 0,
  )
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
  const legacyLinkKeys = {
    website: (link: Profile['links'][number]) =>
      link.label.trim().toLowerCase() === 'website',
    linkedin: (link: Profile['links'][number]) =>
      inferContactLink(link.label, link.url).icon === 'linkedin',
    github: (link: Profile['links'][number]) =>
      inferContactLink(link.label, link.url).icon === 'github',
  } as const
  const personalValue = (key: keyof Profile['personal']) => {
    if (!selected('personal', key)) return ''
    if (key in legacyLinkKeys) {
      const contactKey = key as keyof typeof legacyLinkKeys
      const link = profile.links.find(legacyLinkKeys[contactKey])
      if (link) return selected('personal', `link:${link.id}`) ? link.url : ''
    }
    return profile.personal[key]
  }
  const links = profile.links
    .filter((link) => selected('personal', `link:${link.id}`))
    .map(linkForTemplate)
    .filter((link) => link.href)
  const experience = selected('experience')
    ? profile.experience
        .filter((item) => selected('experience', item.id))
        .map((item) => ({
          ...item,
          dates: formatDate(item.startDate, item.endDate, item.current),
          heading: joinText(item.role, item.company),
          hasHeading: hasText(item.role, item.company),
          hasDates: Boolean(
            formatDate(item.startDate, item.endDate, item.current),
          ),
          hasHeadingOrDates:
            hasText(item.role, item.company) ||
            Boolean(formatDate(item.startDate, item.endDate, item.current)),
          meta: joinText(
            formatDate(item.startDate, item.endDate, item.current),
            item.location,
          ),
          hasMeta: hasText(
            formatDate(item.startDate, item.endDate, item.current),
            item.location,
          ),
          bullets: selectedBullets(
            item.bullets,
            selection.bullets.experience[item.id],
            item.id,
          ),
        }))
        .map((item) => ({ ...item, hasBullets: item.bullets.length > 0 }))
        .filter(
          (item) =>
            hasText(item.role, item.company, item.location, item.dates) ||
            item.bullets.length > 0,
        )
    : []
  const education = selected('education')
    ? profile.education
        .filter((item) => selected('education', item.id))
        .map((item) => ({
          ...item,
          dates: formatDate(item.startDate, item.endDate),
          heading: joinText(item.degree, item.institution),
          hasHeading: hasText(item.degree, item.institution),
          hasDates: Boolean(formatDate(item.startDate, item.endDate)),
          meta: joinText(
            item.location,
            formatDate(item.startDate, item.endDate),
          ),
          hasMeta: hasText(
            item.location,
            formatDate(item.startDate, item.endDate),
          ),
          hasDetails: Boolean(item.details.trim()),
        }))
        .filter((item) =>
          hasText(
            item.degree,
            item.institution,
            item.location,
            item.dates,
            item.details,
          ),
        )
    : []
  const skills = selected('skills')
    ? profile.skills
        .filter((group) => selected('skills', group.id))
        .flatMap((group) =>
          group.skills.flatMap((value, index) =>
            selected('skills', `${group.id}:skill:${index}`) && value.trim()
              ? [{ value: value.trim(), group: group.name.trim() }]
              : [],
          ),
        )
    : []
  const projects = selected('projects')
    ? profile.projects
        .filter((item) => selected('projects', item.id))
        .map((item) => ({
          ...item,
          heading: item.name.trim(),
          hasHeading: Boolean(item.name.trim()),
          meta: joinText(item.url),
          description: item.description.trim(),
          url: safeContactHref(item.url),
          hasDescription: Boolean(item.description.trim()),
          hasUrl: Boolean(safeContactHref(item.url)),
          technologies: item.technologies
            .map((value) => value.trim())
            .filter(Boolean)
            .map((value) => ({ value })),
          dates: '',
          bullets: selectedBullets(
            item.bullets,
            selection.bullets.projects[item.id],
            item.id,
          ),
        }))
        .map((item) => ({
          ...item,
          hasBullets: item.bullets.length > 0,
          hasTechnologies: item.technologies.length > 0,
        }))
        .filter(
          (item) =>
            hasText(item.name, item.description, item.url) ||
            item.technologies.length > 0 ||
            item.bullets.length > 0,
        )
    : []
  const certifications = selected('certifications')
    ? profile.certifications
        .filter(
          (item) => selected('certifications', item.id) && hasAnyText(item),
        )
        .map((item) => ({
          ...item,
          hasName: Boolean(item.name.trim()),
          url: safeContactHref(item.url),
          hasUrl: Boolean(safeContactHref(item.url)),
          meta: joinText(item.issuer, item.date),
          hasMeta: hasText(item.issuer, item.date),
          display: joinText(item.name, item.issuer, item.date, item.url),
        }))
    : []
  const awards = selected('awards')
    ? profile.awards
        .filter((item) => selected('awards', item.id) && hasAnyText(item))
        .map((item) => ({
          ...item,
          hasHeading: Boolean(item.name.trim()),
          meta: joinText(item.issuer, item.date),
          hasDescription: Boolean(item.description.trim()),
        }))
    : []
  const publications = selected('publications')
    ? profile.publications
        .filter((item) => selected('publications', item.id) && hasAnyText(item))
        .map((item) => ({
          ...item,
          hasHeading: Boolean(item.title.trim()),
          url: safeContactHref(item.url),
          hasUrl: Boolean(safeContactHref(item.url)),
          meta: joinText(item.publisher, item.date),
          hasDescription: Boolean(item.description.trim()),
        }))
    : []
  const customSections = selected('customSections')
    ? profile.customSections
        .filter((section) => selected('customSections', section.id))
        .map((section) => ({
          ...section,
          hasTitle: Boolean(section.title.trim()),
          items: section.items
            .filter(
              (item) =>
                selected('customSections', `${section.id}:${item.id}`) &&
                hasAnyText(item),
            )
            .map((item) => ({
              ...item,
              hasTitle: Boolean(item.title.trim()),
              hasSubtitle: Boolean(item.subtitle.trim()),
              hasDate: Boolean(item.date.trim()),
              meta: joinText(item.subtitle, item.date),
              hasMeta: hasText(item.subtitle, item.date),
              hasDescription: Boolean(item.description.trim()),
            })),
        }))
        .filter((section) => section.items.length > 0)
    : []
  const sectionVisibility = {
    personal:
      selected('personal') &&
      ((Object.keys(profile.personal) as Array<keyof Profile['personal']>).some(
        (key) => personalValue(key).trim().length > 0,
      ) ||
        links.length > 0),
    summary: selected('summary') && profile.summary.trim().length > 0,
    experience: experience.length > 0,
    education: education.length > 0,
    skills: skills.length > 0,
    projects: projects.length > 0,
    certifications: certifications.length > 0,
    awards: awards.length > 0,
    publications: publications.length > 0,
    customSections: customSections.length > 0,
  }

  return {
    name: personalValue('fullName'),
    title: personalValue('headline'),
    email: personalValue('email'),
    phone: personalValue('phone'),
    location: personalValue('location'),
    website: personalValue('website'),
    linkedin: personalValue('linkedin'),
    github: personalValue('github'),
    links,
    contactDetails: [
      personalValue('location'),
      personalValue('email'),
      personalValue('phone'),
    ]
      .filter((value) => value.trim())
      .map((value) => ({ value })),
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
    experience,
    education,
    skills,
    projects,
    certifications,
    awards,
    publications,
    customSections,
  }
}

function applyTemplateConfiguration(
  css: string,
  configuration: Record<string, string | number | boolean>,
  template: ResumeTemplate,
) {
  const declarations = template.controls.flatMap((control) => {
    const value = configuration[control.key] ?? control.defaultValue
    const valid =
      control.type === 'select'
        ? control.options?.some((option) => option.value === value)
        : control.type === 'color'
          ? typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
          : typeof value === 'number' &&
            Number.isFinite(value) &&
            value >= (control.min ?? 0) &&
            value <= (control.max ?? 100)
    return valid ? [`${control.variable}: ${value}${control.unit ?? ''};`] : []
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
    css: applyTemplateConfiguration(
      template.css,
      resume.templateConfiguration,
      template,
    ),
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
