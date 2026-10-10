import { z } from 'zod'

const isoDateString = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)))

export const templateControlSchema = z.object({
  key: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
  label: z.string().trim().min(1),
  type: z.enum(['select', 'range', 'color']),
  variable: z.string().regex(/^--resume-[a-z][a-z0-9-]*$/),
  options: z
    .array(z.object({ label: z.string().trim().min(1), value: z.string() }))
    .optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
  unit: z.string().optional(),
  defaultValue: z.union([z.string(), z.number()]),
})

export const customTemplateSchema = z.object({
  id: z.string().regex(/^custom-[a-f0-9-]{36}$/i),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(500),
  version: z.string().min(1).max(32),
  schemaVersion: z.literal(1),
  sourceTemplateId: z.string().min(1).nullable(),
  controls: z.array(templateControlSchema).max(30),
  html: z.string().max(2_000_000),
  css: z.string().max(2_000_000),
  defaults: z.record(z.string(), z.unknown()),
  createdAt: isoDateString,
  updatedAt: isoDateString,
})

export function parseCustomTemplate(value: unknown) {
  return customTemplateSchema.parse(value)
}

export function safeParseCustomTemplate(value: unknown) {
  return customTemplateSchema.safeParse(value)
}
