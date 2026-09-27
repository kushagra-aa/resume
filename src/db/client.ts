import Dexie, { type Table } from 'dexie'

import type { ResumeDocument } from '#/models/resume'

export const RESUME_DATABASE_NAME = 'resume'
export const RESUME_DATABASE_VERSION = 1

export class ResumeDatabase extends Dexie {
  documents!: Table<ResumeDocument, string>

  constructor() {
    super(RESUME_DATABASE_NAME)

    this.version(RESUME_DATABASE_VERSION).stores({
      documents: 'id, name, createdAt, updatedAt',
    })
  }
}

export const resumeDatabase = new ResumeDatabase()
