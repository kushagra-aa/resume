export type ProfileSectionKey =
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'awards'
  | 'publications'
  | 'customSections'

export type ResumeSelection = {
  sections: Record<ProfileSectionKey, boolean>
  items: Partial<Record<ProfileSectionKey, Record<string, boolean>>>
  bullets: {
    experience: Record<string, Record<string, boolean>>
    projects: Record<string, Record<string, boolean>>
  }
}

export type ResumeCustomization = {
  sectionTitles: Partial<Record<ProfileSectionKey, string>>
  sectionOrder?: ProfileSectionKey[]
  itemOrder?: Partial<Record<ProfileSectionKey, string[]>>
}

export type StructuredResume = {
  id: string
  name: string
  schemaVersion: 1
  profileId: string
  templateId: string
  selection: ResumeSelection
  templateConfiguration: Record<string, string | number | boolean>
  customization: ResumeCustomization
  createdAt: string
  updatedAt: string
}
