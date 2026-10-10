import { describe, expect, it } from 'vitest'

import { createStructuredResume } from '#/features/resumes/create-structured-resume'
import {
  createStructuredTemplateData,
  renderStructuredResume,
} from '#/features/resumes/structured-renderer'
import { parseStructuredResume } from '#/schemas/structured-resume'
import {
  completeProfileFixture,
  completeTemplateFixture,
} from './fixtures/structured-render-fixtures'

function makeResume() {
  return createStructuredResume(completeProfileFixture, 'fixture-template')
}

describe('structured resume rendering', () => {
  it('renders all profile sections and safely escapes profile content', () => {
    const profile = structuredClone(completeProfileFixture)
    profile.personal.fullName = '<Morgan Chen>'
    const rendered = renderStructuredResume(
      profile,
      makeResume(),
      completeTemplateFixture,
    )

    expect(rendered.html).toContain('&lt;Morgan Chen&gt;')
    expect(rendered.html).toContain('Led platform work')
    expect(rendered.html).toContain('BS Computer Science')
    expect(rendered.html).toContain('Seattle 2013 – 2017')
    expect(rendered.html).toContain('Engineering TypeScript')
    expect(rendered.html).toContain('TypeScript')
    expect(rendered.html).toContain('Launchpad')
    expect(rendered.html).toContain('https://example.test/launchpad')
    expect(rendered.html).toContain('Cloud Org 2024 https://example.test/cert')
    expect(rendered.html).toContain('Cloud Architect')
    expect(rendered.html).toContain('Engineering Award')
    expect(rendered.html).toContain('Reliable Systems')
    expect(rendered.html).toContain('https://example.test/article')
    expect(rendered.html).toContain('Mentor')
    expect(rendered.html).not.toContain('{{')
  })

  it('honors section, item, and nested bullet selections without modifying profile data', () => {
    const profile = structuredClone(completeProfileFixture)
    const resume = makeResume()
    resume.selection.sections.skills = false
    resume.selection.items.experience!['experience-one'] = false
    resume.selection.bullets.projects['project-one']!['project-one-bullet-0'] =
      false
    const before = structuredClone(profile)
    const data = createStructuredTemplateData(profile, resume)
    const rendered = renderStructuredResume(
      profile,
      resume,
      completeTemplateFixture,
    )

    expect(data.sectionVisibility.skills).toBe(false)
    expect(rendered.html).not.toContain('React')
    expect(rendered.html).not.toContain('Staff Engineer')
    expect(rendered.html).not.toContain('Reduced setup time')
    expect(profile).toEqual(before)
  })

  it('honors individual personal fields, skills, and custom section entries', () => {
    const resume = makeResume()
    resume.selection.items.personal!.email = false
    resume.selection.items.skills!['skills-one:skill:0'] = false
    resume.selection.items.customSections!['custom-one:custom-item-one'] = false
    const rendered = renderStructuredResume(
      completeProfileFixture,
      resume,
      completeTemplateFixture,
    )

    expect(rendered.html).not.toContain('morgan@example.test')
    expect(rendered.html).not.toContain('Engineering TypeScript')
    expect(rendered.html).not.toContain('Mentors early-career developers')
    expect(rendered.html).toContain('React')
  })

  it('hides empty optional sections and resolves missing content to empty values', () => {
    const profile = structuredClone(completeProfileFixture)
    profile.awards = []
    profile.publications = []
    profile.summary = ''
    const data = createStructuredTemplateData(profile, makeResume())
    const rendered = renderStructuredResume(
      profile,
      makeResume(),
      completeTemplateFixture,
    )

    expect(data.sectionVisibility.awards).toBe(false)
    expect(data.sectionVisibility.publications).toBe(false)
    expect(data.sectionVisibility.summary).toBe(false)
    expect(rendered.html).not.toContain('Engineering Award')
    expect(rendered.html).not.toContain('Reliable Systems')
  })

  it('applies safe template configuration and rejects malformed structured data', () => {
    const resume = makeResume()
    resume.templateConfiguration.accent = '#123456'
    resume.templateConfiguration.fontSize = 11
    resume.templateConfiguration['bad};<script'] = 'alert(1)'
    const template = structuredClone(completeTemplateFixture)
    template.controls = [
      {
        key: 'accent',
        label: 'Accent color',
        type: 'color',
        variable: '--resume-accent',
        defaultValue: '#000000',
      },
      {
        key: 'fontSize',
        label: 'Font size',
        type: 'range',
        variable: '--resume-font-size',
        min: 9,
        max: 12,
        step: 0.5,
        unit: 'pt',
        defaultValue: 10,
      },
    ]
    const rendered = renderStructuredResume(
      completeProfileFixture,
      resume,
      template,
    )

    expect(rendered.css).toContain('--resume-accent: #123456;')
    expect(rendered.css).toContain('--resume-font-size: 11pt;')
    expect(rendered.css).not.toContain('<script')
    expect(() => parseStructuredResume({ ...resume, profileId: '' })).toThrow()
  })
})
