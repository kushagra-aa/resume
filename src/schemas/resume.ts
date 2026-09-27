import { z } from 'zod'

const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Expected a valid date string',
  })

export const resumeDocumentSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  html: z.string(),
  css: z.string(),
  createdAt: isoDateString,
  updatedAt: isoDateString,
})

export type ResumeDocumentInput = z.input<typeof resumeDocumentSchema>

export function parseResumeDocument(value: unknown) {
  return resumeDocumentSchema.parse(value)
}

export function safeParseResumeDocument(value: unknown) {
  return resumeDocumentSchema.safeParse(value)
}
