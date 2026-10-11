import type { Profile } from '#/models/profile'
import type { ResumeTemplate } from '#/features/templates/template-types'

export const completeProfileFixture: Profile = {
  id: 'profile-structured-fixture',
  name: 'Morgan Chen',
  schemaVersion: 2,
  personal: {
    fullName: 'Morgan Chen',
    headline: 'Staff Software Engineer',
    email: 'morgan@example.test',
    phone: '+1 555 0100',
    location: 'Seattle, WA',
    website: 'morgan.example.test',
    linkedin: 'linkedin.com/in/morgan',
    github: 'github.com/morgan',
  },
  links: [
    {
      id: 'link-github',
      label: 'GitHub',
      url: 'https://github.com/morgan',
    },
  ],
  summary: 'Builds reliable software products.',
  experience: [
    {
      id: 'experience-one',
      company: 'Northstar',
      role: 'Staff Engineer',
      location: 'Seattle',
      startDate: '2021',
      endDate: '',
      current: true,
      bullets: ['Led platform work', 'Improved reliability'],
    },
  ],
  education: [
    {
      id: 'education-one',
      institution: 'State University',
      degree: 'BS Computer Science',
      location: 'Seattle',
      startDate: '2013',
      endDate: '2017',
      details: 'Honors',
    },
  ],
  skills: [
    { id: 'skills-one', name: 'Engineering', skills: ['TypeScript', 'React'] },
  ],
  projects: [
    {
      id: 'project-one',
      name: 'Launchpad',
      description: 'Internal developer platform',
      url: 'https://example.test/launchpad',
      technologies: ['TypeScript'],
      bullets: ['Reduced setup time'],
    },
  ],
  certifications: [
    {
      id: 'cert-one',
      name: 'Cloud Architect',
      issuer: 'Cloud Org',
      date: '2024',
      url: 'https://example.test/cert',
    },
  ],
  awards: [
    {
      id: 'award-one',
      name: 'Engineering Award',
      issuer: 'Northstar',
      date: '2023',
      description: 'Team recognition',
    },
  ],
  publications: [
    {
      id: 'publication-one',
      title: 'Reliable Systems',
      publisher: 'Tech Journal',
      date: '2022',
      url: 'https://example.test/article',
      description: 'An article',
    },
  ],
  customSections: [
    {
      id: 'custom-one',
      title: 'Community',
      items: [
        {
          id: 'custom-item-one',
          title: 'Mentor',
          subtitle: 'Code Club',
          date: '2020–Present',
          description: 'Mentors early-career developers',
        },
      ],
    },
  ],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
}

export const completeTemplateFixture: ResumeTemplate = {
  id: 'fixture-template',
  name: 'Fixture',
  description: 'Template covering all profile sections',
  version: '1.0.0',
  controls: [],
  defaults: {},
  css: '.resume { color: var(--resume-accent, #222); }',
  html: `<main class="resume"><header><h1>{{name}}</h1><p>{{title}}</p><p>{{email}} {{phone}} {{location}} {{website}} {{linkedin}} {{github}}</p></header>
{{#sectionVisibility.summary}}<p>{{summary}}</p>{{/sectionVisibility.summary}}
{{#sectionVisibility.experience}}<section><h2>{{sectionTitles.experience}}</h2>{{#experience}}<article><h3>{{role}} {{company}}</h3><p>{{dates}} {{location}}</p><ul>{{#bullets}}<li>{{value}}</li>{{/bullets}}</ul></article>{{/experience}}</section>{{/sectionVisibility.experience}}
{{#sectionVisibility.education}}<section>{{#education}}<p>{{degree}} {{institution}} {{location}} {{dates}} {{details}}</p>{{/education}}</section>{{/sectionVisibility.education}}
{{#sectionVisibility.skills}}<section>{{#skills}}<span>{{group}} {{value}}</span>{{/skills}}</section>{{/sectionVisibility.skills}}
{{#sectionVisibility.projects}}<section>{{#projects}}<article><h3>{{name}}</h3><p>{{description}} {{url}} {{#technologies}}{{value}} {{/technologies}}</p><ul>{{#bullets}}<li>{{value}}</li>{{/bullets}}</ul></article>{{/projects}}</section>{{/sectionVisibility.projects}}
{{#sectionVisibility.certifications}}<section>{{#certifications}}<p>{{name}} {{issuer}} {{date}} {{url}}</p>{{/certifications}}</section>{{/sectionVisibility.certifications}}
{{#sectionVisibility.awards}}<section>{{#awards}}<p>{{name}} {{issuer}} {{date}} {{description}}</p>{{/awards}}</section>{{/sectionVisibility.awards}}
{{#sectionVisibility.publications}}<section>{{#publications}}<p>{{title}} {{publisher}} {{date}} {{url}} {{description}}</p>{{/publications}}</section>{{/sectionVisibility.publications}}
{{#sectionVisibility.customSections}}{{#customSections}}<section><h2>{{title}}</h2>{{#items}}<p>{{title}} {{subtitle}} {{date}} {{description}}</p>{{/items}}</section>{{/customSections}}{{/sectionVisibility.customSections}}</main>`,
}
