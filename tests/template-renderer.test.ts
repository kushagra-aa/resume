import { describe, expect, it } from 'vitest'

import { renderTemplate } from '#/features/templates/template-renderer'

describe('renderTemplate', () => {
  it('escapes normal values and supports raw values', () => {
    expect(
      renderTemplate('{{name}} {{{html}}}', {
        name: '<script>alert(1)</script>',
        html: '<strong>Ready</strong>',
      }),
    ).toBe('&lt;script&gt;alert(1)&lt;/script&gt; <strong>Ready</strong>')
  })

  it('renders repeated sections with item values', () => {
    const source = '{{#experience}}<h2>{{company}}</h2>{{/experience}}'
    expect(
      renderTemplate(source, {
        experience: [{ company: 'Acme' }, { company: 'Beta' }],
      }),
    ).toBe('<h2>Acme</h2><h2>Beta</h2>')
  })

  it('renders empty output for missing values and collections', () => {
    expect(
      renderTemplate('{{name}}{{#experience}}ignored{{/experience}}', {}),
    ).toBe('')
  })

  it('produces detached source content with resolved values', () => {
    const template =
      '<h1>{{name}}</h1>{{#experience}}<p>{{company}}</p>{{/experience}}'
    const generated = renderTemplate(template, {
      name: 'Kushagra',
      experience: [{ company: 'Solvative' }],
    })

    expect(generated).toContain('<h1>Kushagra</h1>')
    expect(generated).toContain('<p>Solvative</p>')
    expect(generated).not.toContain('{{')
  })
})
