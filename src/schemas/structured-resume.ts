import { z } from 'zod'

const profileSectionKeys = [
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
] as const

const visibilityMap = z.record(z.string(), z.boolean())
const sectionVisibilitySchema = z.object({
  personal: z.boolean(),
  summary: z.boolean(),
  experience: z.boolean(),
  education: z.boolean(),
  skills: z.boolean(),
  projects: z.boolean(),
  certifications: z.boolean(),
  awards: z.boolean(),
  publications: z.boolean(),
  customSections: z.boolean(),
})
const selectionSchema = z.object({
  sections: sectionVisibilitySchema,
  items: z.partialRecord(z.enum(profileSectionKeys), visibilityMap),
  bullets: z.object({
    experience: z.record(z.string(), visibilityMap),
    projects: z.record(z.string(), visibilityMap),
  }),
})

const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)))

export const structuredResumeSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  schemaVersion: z.literal(1),
  profileId: z.string().min(1),
  templateId: z.string().min(1),
  selection: selectionSchema,
  templateConfiguration: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  ),
  customization: z.object({
    sectionTitles: z.partialRecord(z.enum(profileSectionKeys), z.string()),
    sectionOrder: z.array(z.enum(profileSectionKeys)).optional(),
    itemOrder: z
      .partialRecord(z.enum(profileSectionKeys), z.array(z.string()))
      .optional(),
  }),
  createdAt: isoDateString,
  updatedAt: isoDateString,
})

export function parseStructuredResume(value: unknown) {
  return structuredResumeSchema.parse(value)
}

export function safeParseStructuredResume(value: unknown) {
  return structuredResumeSchema.safeParse(value)
}
