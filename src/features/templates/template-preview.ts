import { renderTemplate } from './template-renderer'
import type { ResumeTemplate } from './template-types'

export function createTemplatePreviewDocument(template: ResumeTemplate) {
  const defaults = template.defaults
  const collection = (key: string) =>
    Array.isArray(defaults[key]) ? (defaults[key] as unknown[]) : []
  const asItems = (items: unknown[]) =>
    items.map((item) =>
      item && typeof item === 'object' && !Array.isArray(item)
        ? {
            ...(item as Record<string, unknown>),
            bullets: Array.isArray((item as Record<string, unknown>).bullets)
              ? ((item as Record<string, unknown>).bullets as unknown[]).map(
                  (bullet) =>
                    typeof bullet === 'string' ? { value: bullet } : bullet,
                )
              : [],
          }
        : item,
    )
  const data = {
    ...defaults,
    experience: asItems(collection('experience')),
    projects: asItems(collection('projects')),
    skills: collection('skills').map((skill) =>
      typeof skill === 'string' ? { value: skill, group: '' } : skill,
    ),
    sectionTitles: {
      summary: 'Profile',
      experience: 'Experience',
      education: 'Education',
      skills: 'Skills',
      projects: 'Projects',
      certifications: 'Certifications',
      awards: 'Awards',
      publications: 'Publications',
      customSections: 'Additional',
    },
    sectionVisibility: {
      personal: true,
      summary: Boolean(defaults.summary),
      experience: collection('experience').length > 0,
      education: Boolean(defaults.education),
      skills: collection('skills').length > 0,
      projects: collection('projects').length > 0,
      certifications: collection('certifications').length > 0,
      awards: collection('awards').length > 0,
      publications: collection('publications').length > 0,
      customSections: collection('customSections').length > 0,
    },
  }
  return {
    id: `template-preview-${template.id}`,
    name: `${template.name} template preview`,
    html: renderTemplate(template.html, data),
    css: template.css,
    createdAt: '',
    updatedAt: '',
  }
}
