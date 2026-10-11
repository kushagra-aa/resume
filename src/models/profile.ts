export type PersonalInfo = {
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  github: string
}

export type ContactLink = {
  id: string
  label: string
  url: string
}

export type Experience = {
  id: string
  company: string
  role: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

export type Education = {
  id: string
  institution: string
  degree: string
  location: string
  startDate: string
  endDate: string
  details: string
}

export type Skill = {
  id: string
  name: string
  skills: string[]
}

export type Project = {
  id: string
  name: string
  description: string
  url: string
  technologies: string[]
  bullets: string[]
}

export type Certification = {
  id: string
  name: string
  issuer: string
  date: string
  url: string
}

export type Award = {
  id: string
  name: string
  issuer: string
  date: string
  description: string
}

export type Publication = {
  id: string
  title: string
  publisher: string
  date: string
  url: string
  description: string
}

export type CustomSectionItem = {
  id: string
  title: string
  subtitle: string
  date: string
  description: string
}

export type CustomSection = {
  id: string
  title: string
  items: CustomSectionItem[]
}

export type Profile = {
  id: string
  name: string
  schemaVersion: 2
  personal: PersonalInfo
  links: ContactLink[]
  summary: string
  experience: Experience[]
  education: Education[]
  skills: Skill[]
  projects: Project[]
  certifications: Certification[]
  awards: Award[]
  publications: Publication[]
  customSections: CustomSection[]
  createdAt: string
  updatedAt: string
}
