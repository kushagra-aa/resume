import { resumeRepository } from '#/db/repositories/resume-repository'
import { createStarterDocument } from '#/features/templates/starter-template'
import type { ResumeDocument } from '#/models/resume'
import { safeParseResumeDocument } from '#/schemas/resume'

const LEGACY_DOCUMENTS_KEY = 'resume:poc:documents'
const LEGACY_SINGLE_DOCUMENT_KEY = 'resume:poc:document'

function readLegacyDocuments() {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(LEGACY_DOCUMENTS_KEY)
    const parsed = stored ? JSON.parse(stored) : null
    if (Array.isArray(parsed)) {
      return parsed.flatMap((value) => {
        const result = safeParseResumeDocument(value)
        return result.success ? [result.data] : []
      })
    }

    const legacy = window.localStorage.getItem(LEGACY_SINGLE_DOCUMENT_KEY)
    const result = safeParseResumeDocument(legacy ? JSON.parse(legacy) : null)
    return result.success ? [result.data] : []
  } catch {
    return []
  }
}

export async function loadResumes(): Promise<ResumeDocument[]> {
  const stored = await resumeRepository.list()
  if (stored.length) return stored

  const legacyDocuments = readLegacyDocuments()
  if (legacyDocuments.length) {
    for (const document of legacyDocuments)
      await resumeRepository.create(document)
    return resumeRepository.list()
  }

  const starter = createStarterDocument()
  await resumeRepository.create(starter)
  return [starter]
}
