import type { ContactLink } from '#/models/profile'

const knownSites = [
  { match: /github/i, label: 'GitHub', icon: 'github' },
  { match: /linkedin/i, label: 'LinkedIn', icon: 'linkedin' },
  { match: /youtube|youtu\.be/i, label: 'YouTube', icon: 'youtube' },
  { match: /instagram/i, label: 'Instagram', icon: 'instagram' },
  { match: /x\.com|twitter/i, label: 'X', icon: 'x' },
  { match: /facebook/i, label: 'Facebook', icon: 'facebook' },
  { match: /medium/i, label: 'Medium', icon: 'medium' },
  { match: /behance/i, label: 'Behance', icon: 'behance' },
] as const

export function inferContactLink(label: string, url: string) {
  const source = `${label} ${url}`
  const match = knownSites.find((site) => site.match.test(source))
  return match ?? { label, icon: 'link' }
}

export function normalizeContactUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed || /^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function safeContactHref(value: string) {
  const normalized = normalizeContactUrl(value)
  return /^(https?:|mailto:|tel:)/i.test(normalized) ? normalized : ''
}

export function linkForTemplate(link: ContactLink) {
  const site = inferContactLink(link.label, link.url)
  const iconText: Record<string, string> = {
    github: 'GH',
    linkedin: 'in',
    youtube: '▶',
    instagram: '◎',
    x: 'X',
    facebook: 'f',
    medium: 'M',
    behance: 'Bē',
    link: '↗',
  }
  return {
    id: link.id,
    label: link.label.trim() || site.label || 'Link',
    url: link.url,
    href: safeContactHref(link.url),
    icon: site.icon,
    iconText: iconText[site.icon] ?? '↗',
  }
}
