import 'fake-indexeddb/auto'

import { beforeEach, describe, expect, it } from 'vitest'

import { resumeDatabase } from '#/db/client'
import { profileRepository } from '#/db/repositories/profile-repository'
import { structuredResumeRepository } from '#/db/repositories/structured-resume-repository'
import { createStructuredResume } from '#/features/resumes/create-structured-resume'
import { renderStructuredResume } from '#/features/resumes/structured-renderer'
import type { ResumeDocument } from '#/models/resume'
import { completeProfileFixture } from './fixtures/structured-render-fixtures'
import { completeTemplateFixture } from './fixtures/structured-render-fixtures'
import { resumeRepository } from '#/db/repositories/resume-repository'
import { customTemplateRepository } from '#/db/repositories/custom-template-repository'

describe('structured resume persistence and legacy compatibility', () => {
  beforeEach(async () => {
    await resumeDatabase.structuredResumes.clear()
    await resumeDatabase.profiles.clear()
    await resumeDatabase.documents.clear()
    await resumeDatabase.resumeHistory.clear()
  })

  it('persists resume configuration across reloads without changing its profile', async () => {
    const profile = structuredClone(completeProfileFixture)
    await profileRepository.create(profile)
    const resume = createStructuredResume(profile, 'classic')
    resume.selection.sections.skills = false
    await structuredResumeRepository.create(resume)

    const reopened = await structuredResumeRepository.get(resume.id)
    expect(reopened?.selection.sections.skills).toBe(false)
    expect(
      await structuredResumeRepository.listByProfile(profile.id),
    ).toHaveLength(1)
    expect((await profileRepository.get(profile.id))?.skills).toEqual(
      profile.skills,
    )
  })

  it('duplicates and deletes resumes and prevents deleting a referenced profile', async () => {
    const profile = structuredClone(completeProfileFixture)
    await profileRepository.create(profile)
    const resume = await structuredResumeRepository.create(
      createStructuredResume(profile, 'classic'),
    )
    const duplicate = await structuredResumeRepository.duplicate(resume)

    expect(duplicate.id).not.toBe(resume.id)
    expect(duplicate.profileId).toBe(profile.id)
    await expect(profileRepository.delete(profile.id)).rejects.toThrow(
      /resumes before deleting/,
    )
    await structuredResumeRepository.delete(resume.id)
    await structuredResumeRepository.delete(duplicate.id)
    await profileRepository.delete(profile.id)
    expect(await profileRepository.get(profile.id)).toBeNull()
  })

  it('skips malformed structured resume records without hiding legacy documents', async () => {
    await resumeDatabase.structuredResumes.put({ id: 'broken' } as never)
    const legacy: ResumeDocument = {
      id: 'legacy-one',
      name: 'Legacy source',
      html: '<main>Legacy</main>',
      css: '.resume {}',
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    }
    await resumeRepository.create(legacy)

    expect(await structuredResumeRepository.get('broken')).toBeNull()
    expect(await structuredResumeRepository.list()).toEqual([])
    expect(await resumeRepository.get(legacy.id)).toEqual(legacy)
  })

  it('creates profile data, saves resume selections, and renders the selected preview source', async () => {
    const profile = structuredClone(completeProfileFixture)
    await profileRepository.create(profile)
    const resume = createStructuredResume(profile, completeTemplateFixture.id)
    resume.selection.sections.experience = false
    resume.selection.items.skills!['skills-one:skill:0'] = false
    await structuredResumeRepository.create(resume)

    const reopened = await structuredResumeRepository.get(resume.id)
    const preview = renderStructuredResume(
      profile,
      reopened!,
      completeTemplateFixture,
    )

    expect(preview.html).not.toContain('Staff Engineer')
    expect(preview.html).not.toContain('Engineering TypeScript')
    expect(preview.html).toContain('React')
    expect((await profileRepository.get(profile.id))?.experience).toEqual(
      profile.experience,
    )
  })

  it('starts with an empty V1 workspace while built-in templates remain available separately', async () => {
    expect(await profileRepository.list()).toEqual([])
    expect(await structuredResumeRepository.list()).toEqual([])
    expect(await customTemplateRepository.list()).toEqual([])
    expect(await resumeRepository.list()).toEqual([])
  })

  it('applies profile edits to linked resumes according to each resume selection', async () => {
    const profile = structuredClone(completeProfileFixture)
    await profileRepository.create(profile)
    const included = await structuredResumeRepository.create(
      createStructuredResume(profile, completeTemplateFixture.id, 'Included'),
    )
    const tailored = createStructuredResume(
      profile,
      completeTemplateFixture.id,
      'Tailored',
    )
    tailored.selection.items.experience!['experience-one'] = false
    await structuredResumeRepository.create(tailored)

    const editedProfile = {
      ...profile,
      experience: profile.experience.map((item) =>
        item.id === 'experience-one'
          ? { ...item, role: 'Principal Engineer' }
          : item,
      ),
    }
    await profileRepository.update(editedProfile)
    const includedOutput = renderStructuredResume(
      editedProfile,
      included,
      completeTemplateFixture,
    )
    const tailoredOutput = renderStructuredResume(
      editedProfile,
      tailored,
      completeTemplateFixture,
    )

    expect(includedOutput.html).toContain('Principal Engineer')
    expect(tailoredOutput.html).not.toContain('Principal Engineer')
    expect((await profileRepository.get(profile.id))?.experience[0]?.role).toBe(
      'Principal Engineer',
    )
  })
})
