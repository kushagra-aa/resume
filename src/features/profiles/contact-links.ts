import {
  BookOpen,
  BriefcaseBusiness,
  Camera,
  CirclePlay,
  Code2,
  Globe,
  Link as LinkIcon,
  Mail,
  PanelsTopLeft,
} from 'lucide-react'

import type { ContactLink, ContactLinkIcon } from '#/models/profile'

const knownSites = [
  {
    match: /website|portfolio|personal site/i,
    label: 'Website',
    icon: 'website',
  },
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

export const contactLinkIconOptions: Array<{
  value: ContactLinkIcon
  label: string
}> = [
  { value: 'website', label: 'Website' },
  { value: 'email', label: 'Email' },
  { value: 'code', label: 'Code / developer' },
  { value: 'professional', label: 'Professional network' },
  { value: 'video', label: 'Video' },
  { value: 'social', label: 'Social profile' },
  { value: 'reading', label: 'Publication / reading' },
  { value: 'community', label: 'Community / portfolio' },
  { value: 'link', label: 'General link' },
]

const contactLinkIconComponents = {
  website: Globe,
  email: Mail,
  code: Code2,
  professional: BriefcaseBusiness,
  video: CirclePlay,
  social: Camera,
  reading: BookOpen,
  community: PanelsTopLeft,
  link: LinkIcon,
} satisfies Record<ContactLinkIcon, typeof LinkIcon>

const inferredIconChoices: Partial<Record<string, ContactLinkIcon>> = {
  website: 'website',
  github: 'code',
  linkedin: 'professional',
  youtube: 'video',
  instagram: 'social',
  x: 'social',
  facebook: 'community',
  medium: 'reading',
  behance: 'community',
  link: 'link',
}

export function contactIconForLink(link: ContactLink) {
  return (
    link.icon ??
    inferredIconChoices[inferContactLink(link.label, link.url).icon] ??
    'link'
  )
}

export function contactIconComponent(icon: ContactLinkIcon) {
  return contactLinkIconComponents[icon]
}

function contactIconSvg(icon: ContactLinkIcon) {
  const nodes: Record<ContactLinkIcon, string> = {
    website:
      '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    email:
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    code: '<path d="m8 17-5-5 5-5m8 10 5-5-5-5m-2-7-4 14"/>',
    professional:
      '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a18 18 0 0 0 18 0"/>',
    video: '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
    social:
      '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    reading:
      '<path d="M12 7v14m0-14C9 4 5 4 2 5v14c3-1 7-1 10 2m0-14c3-3 7-3 10-2v14c-3-1-7-1-10 2"/>',
    community:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.07 0l3-3A5 5 0 0 0 13 2.93l-1.72 1.72m2.72 6.35a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.72-1.72"/>',
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${nodes[icon]}</svg>`
}

export function contactDetailIconSvg(detail: 'location' | 'email' | 'phone') {
  const nodes = {
    location:
      '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    email:
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    phone:
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z"/>',
  }[detail]

  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${nodes}</svg>`
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

export function linkForTemplate(link: ContactLink, showIcon = true) {
  const site = inferContactLink(link.label, link.url)
  const icon = contactIconForLink(link)
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
    icon,
    iconText: iconText[site.icon] ?? '↗',
    // This is safe raw template markup: SVG markup comes from this fixed
    // icon map, never from profile-provided strings.
    iconSvg: showIcon ? contactIconSvg(icon) : '',
  }
}
