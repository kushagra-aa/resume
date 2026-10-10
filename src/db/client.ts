import Dexie, { type Table } from 'dexie'

import type { ResumeDocument } from '#/models/resume'
import type { Profile } from '#/models/profile'
import type { StructuredResume } from '#/models/structured-resume'
import type { CustomTemplate } from '#/features/templates/template-types'

export const RESUME_DATABASE_NAME = 'resume'
export const RESUME_DATABASE_VERSION = 4

export class ResumeDatabase extends Dexie {
  documents!: Table<ResumeDocument, string>
  profiles!: Table<Profile, string>
  structuredResumes!: Table<StructuredResume, string>
  customTemplates!: Table<CustomTemplate, string>

  constructor() {
    super(RESUME_DATABASE_NAME)

    this.version(2).stores({
      documents: 'id, name, createdAt, updatedAt',
      profiles: 'id, name, createdAt, updatedAt',
    })

    this.version(RESUME_DATABASE_VERSION).stores({
      documents: 'id, name, createdAt, updatedAt',
      profiles: 'id, name, createdAt, updatedAt',
      structuredResumes:
        'id, name, profileId, templateId, createdAt, updatedAt',
      customTemplates: 'id, name, sourceTemplateId, createdAt, updatedAt',
    })
  }
}

export const resumeDatabase = new ResumeDatabase()
