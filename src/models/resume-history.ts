import type { ResumeDocument } from '#/models/resume'
import type { StructuredResume } from '#/models/structured-resume'

export type ResumeHistoryEntry = {
  id: string
  resumeId: string
  kind: 'source' | 'structured'
  name: string
  createdAt: string
  snapshot: ResumeDocument | StructuredResume
}
