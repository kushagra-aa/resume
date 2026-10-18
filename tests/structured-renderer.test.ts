import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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
    resume.selection.bullets.projects['project-one']['project-one-bullet-0'] =
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

  it('renders resume-specific section heading customization', () => {
    const resume = makeResume()
    resume.customization.sectionTitles.experience = 'Selected work'
    const rendered = renderStructuredResume(
      completeProfileFixture,
      resume,
      completeTemplateFixture,
    )

    expect(rendered.html).toContain('<h2>Selected work</h2>')
    expect(resume.customization.sectionTitles.experience).toBe('Selected work')
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

  it('omits blank accomplishments and sections with no renderable content', () => {
    const profile = structuredClone(completeProfileFixture)
    profile.summary = ''
    profile.experience = [
      {
        id: 'blank-experience',
        company: '',
        role: 'Engineer',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: ['', '  '],
      },
    ]
    profile.education = []
    profile.skills = [{ id: 'blank-skills', name: '', skills: [' ', ''] }]
    profile.projects = [
      {
        id: 'blank-project',
        name: '',
        description: '',
        url: '',
        technologies: [],
        bullets: ['  '],
      },
    ]
    profile.certifications = []
    profile.awards = []
    profile.publications = []
    profile.customSections = [{ id: 'blank-custom', title: 'Extra', items: [] }]
    const resume = createStructuredResume(profile, 'fixture-template')
    const data = createStructuredTemplateData(profile, resume)
    const template = {
      ...completeTemplateFixture,
      html: '{{#sectionVisibility.experience}}{{#experience}}{{#hasBullets}}<ul>{{#bullets}}<li>{{value}}</li>{{/bullets}}</ul>{{/hasBullets}}{{/experience}}{{/sectionVisibility.experience}}{{#sectionVisibility.projects}}project{{/sectionVisibility.projects}}{{#sectionVisibility.customSections}}custom{{/sectionVisibility.customSections}}',
    }
    const rendered = renderStructuredResume(profile, resume, template)

    expect(data.sectionVisibility.experience).toBe(true)
    expect(data.sectionVisibility.education).toBe(false)
    expect(data.sectionVisibility.skills).toBe(false)
    expect(data.sectionVisibility.projects).toBe(false)
    expect(data.sectionVisibility.customSections).toBe(false)
    expect(
      (data.experience as Array<{ bullets: Array<{ value: string }> }>)[0]
        ?.bullets,
    ).toEqual([])
    expect(rendered.html).not.toContain('<ul>')
    expect(rendered.html).not.toContain('project')
    expect(rendered.html).not.toContain('custom')
  })

  it('uses independent stable link selections and safe template URLs', () => {
    const resume = makeResume()
    const template = {
      ...completeTemplateFixture,
      html: '{{#sectionVisibility.personal}}{{#links}}<a href="{{href}}">{{label}} {{iconText}}</a>{{/links}}{{/sectionVisibility.personal}}',
    }
    const visible = renderStructuredResume(
      completeProfileFixture,
      resume,
      template,
    )
    expect(visible.html).toContain('https://github.com/morgan')
    expect(visible.html).toContain('GitHub')

    resume.selection.items.personal!['link:link-github'] = false
    const hidden = renderStructuredResume(
      completeProfileFixture,
      resume,
      template,
    )
    expect(hidden.html).not.toContain('github.com/morgan')
  })

  it('renders selectable Lucide link SVGs and respects the resume icon toggle', () => {
    const profile = structuredClone(completeProfileFixture)
    const resume = makeResume()
    profile.links[0].icon = 'website'
    const template = {
      ...completeTemplateFixture,
      html: '{{#links}}<a href="{{href}}">{{{iconSvg}}}{{label}}</a>{{/links}}',
    }

    const withIcons = renderStructuredResume(profile, resume, template)
    expect(withIcons.html).toContain('<svg')
    expect(withIcons.html).toContain('aria-hidden="true"')
    expect(createStructuredTemplateData(profile, resume).links).toEqual(
      expect.arrayContaining([expect.objectContaining({ icon: 'website' })]),
    )

    resume.templateConfiguration.showLinkIcons = false
    const withoutIcons = renderStructuredResume(profile, resume, template)
    expect(withoutIcons.html).not.toContain('<svg')
    expect(withoutIcons.html).toContain('GitHub')
  })

  it('exposes safe credential and publication links and independent custom metadata', () => {
    const profile = structuredClone(completeProfileFixture)
    profile.customSections[0].items = [
      {
        id: 'title-only',
        title: 'Title only',
        subtitle: '',
        date: '',
        description: 'A description without optional metadata.',
      },
      {
        id: 'dated',
        title: 'Dated item',
        subtitle: 'Organization',
        date: '2025',
        description: '',
      },
    ]
    const data = createStructuredTemplateData(profile, makeResume())
    const certification = (
      data.certifications as Array<{
        url: string
        hasUrl: boolean
        meta: string
      }>
    )[0]
    const publication = (
      data.publications as Array<{
        url: string
        hasUrl: boolean
        meta: string
      }>
    )[0]
    const customItems = (
      data.customSections as Array<{
        items: Array<{
          hasSubtitle: boolean
          hasDate: boolean
          hasDescription: boolean
        }>
      }>
    )[0].items

    expect(certification).toMatchObject({
      url: 'https://example.test/cert',
      hasUrl: true,
      meta: 'Cloud Org · 2024',
    })
    expect(publication).toMatchObject({
      url: 'https://example.test/article',
      hasUrl: true,
      meta: 'Tech Journal · 2022',
    })
    expect(customItems).toEqual([
      expect.objectContaining({
        hasSubtitle: false,
        hasDate: false,
        hasDescription: true,
      }),
      expect.objectContaining({
        hasSubtitle: true,
        hasDate: true,
        hasDescription: false,
      }),
    ])
  })

  it('renders built-in templates with safe external anchors for every linked record', () => {
    for (const templateId of ['classic', 'modern', 'minimal']) {
      const resume = makeResume()
      resume.templateId = templateId
      const template = {
        ...completeTemplateFixture,
        id: templateId,
        html: readFileSync(
          resolve(process.cwd(), `public/templates/${templateId}/resume.html`),
          'utf8',
        ),
        css: readFileSync(
          resolve(process.cwd(), `public/templates/${templateId}/resume.css`),
          'utf8',
        ),
      }
      const rendered = renderStructuredResume(
        completeProfileFixture,
        resume,
        template,
      )
      const anchors = rendered.html.match(/<a\b[^>]*>/g) ?? []

      expect(rendered.html).not.toContain('{{')
      expect(rendered.html).toContain('href="https://example.test/cert"')
      expect(rendered.html).toContain('href="https://example.test/article"')
      expect(rendered.css).toContain('--resume-accent-ink: color-mix(')
      expect(rendered.css).toContain('--resume-accent-border: color-mix(')
      expect(rendered.html).toContain('data-resume-section=')
      expect(rendered.css).toContain('--resume-order-experience:')
      expect(anchors.length).toBeGreaterThanOrEqual(4)
      expect(
        anchors.every(
          (anchor) =>
            anchor.includes('target="_blank"') &&
            anchor.includes('rel="noopener noreferrer"'),
        ),
      ).toBe(true)
    }
  })

  it('renders reordered profile items in their resume-specific order', () => {
    const profile = structuredClone(completeProfileFixture)
    const secondExperience = {
      ...profile.experience[0],
      id: 'experience-second',
      company: 'Second Company',
      role: 'Second Role',
    }
    profile.experience.push(secondExperience)
    const resume = makeResume()
    resume.customization.itemOrder = {
      experience: ['experience-second', profile.experience[0].id],
    }

    const data = createStructuredTemplateData(profile, resume)
    const experience = data.experience as Array<{ company: string }>

    expect(experience.map((item) => item.company)).toEqual([
      'Second Company',
      profile.experience[0].company,
    ])
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
