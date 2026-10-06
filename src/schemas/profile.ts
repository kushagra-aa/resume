import { z } from 'zod'

const id = z.string().min(1)
const text = z.string()
const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Expected a valid date string',
  })

const personalInfoSchema = z.object({
  fullName: text,
  headline: text,
  email: text,
  phone: text,
  location: text,
  website: text,
  linkedin: text,
  github: text,
})

const experienceSchema = z.object({
  id,
  company: text,
  role: text,
  location: text,
  startDate: text,
  endDate: text,
  current: z.boolean(),
  bullets: z.array(text),
})

const educationSchema = z.object({
  id,
  institution: text,
  degree: text,
  location: text,
  startDate: text,
  endDate: text,
  details: text,
})

const skillSchema = z.object({ id, name: text, skills: z.array(text) })

const projectSchema = z.object({
  id,
  name: text,
  description: text,
  url: text,
  technologies: z.array(text),
  bullets: z.array(text),
})

const certificationSchema = z.object({
  id,
  name: text,
  issuer: text,
  date: text,
  url: text,
})

const awardSchema = z.object({
  id,
  name: text,
  issuer: text,
  date: text,
  description: text,
})

const publicationSchema = z.object({
  id,
  title: text,
  publisher: text,
  date: text,
  url: text,
  description: text,
})

const customSectionItemSchema = z.object({
  id,
  title: text,
  subtitle: text,
  date: text,
  description: text,
})

const customSectionSchema = z.object({
  id,
  title: text,
  items: z.array(customSectionItemSchema),
})

export const profileSchema = z.object({
  id,
  name: z.string().trim().min(1),
  schemaVersion: z.literal(1),
  personal: personalInfoSchema,
  summary: text,
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: z.array(skillSchema),
  projects: z.array(projectSchema),
  certifications: z.array(certificationSchema),
  awards: z.array(awardSchema),
  publications: z.array(publicationSchema),
  customSections: z.array(customSectionSchema),
  createdAt: isoDateString,
  updatedAt: isoDateString,
})

export type ProfileInput = z.input<typeof profileSchema>

export function parseProfile(value: unknown) {
  return profileSchema.parse(value)
}

export function safeParseProfile(value: unknown) {
  return profileSchema.safeParse(value)
}
