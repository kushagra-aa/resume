import type { ResumeDocument } from '#/models/resume'

export const starterHtml = `<main class="resume">
  <header class="resume-header">
    <div class="identity">
      <h1>Kushagra Agnihotri</h1>
      <p class="role-title">Full-stack Developer</p>
      <p class="summary">
        <strong>Full-stack developer</strong> with
        <strong>3.5+ years</strong> of experience building, scaling, and owning
        production web applications using
        <strong>React, Node.js, TypeScript, and PostgreSQL.</strong> Strong
        experience across frontend, backend, APIs, authentication, and
        serverless architectures. Proven ability to take features from
        requirements to deployment, working closely with product and
        non-technical stakeholders in fast-paced environments.
      </p>
    </div>
    <div class="contact">
      <a href="mailto:kushagraagnihotri24@gmail.com"
        >kushagraagnihotri24@gmail.com <span class="contact-icon">✉</span></a
      >
      <a href="tel:+918299446479"
        >+91 8299446479 <span class="contact-icon">◧</span></a
      >
      <a href="https://kushagra-aa.vercel.app"
        >kushagra-aa.vercel.app <span class="contact-icon">↗</span></a
      >
      <a href="https://linkedin.com/in/kushagra-aa"
        >linkedin.com/in/kushagra-aa <span class="contact-icon">in</span></a
      >
      <a href="https://github.com/kushagra-aa"
        >github.com/kushagra-aa <span class="contact-icon">●</span></a
      >
    </div>
  </header>

  <div class="resume-grid">
    <section class="experience-column">
      <h2>Work Experience</h2>
      <article class="role">
        <h3>JavaScript Developer</h3>
        <p class="company">Solvative</p>
        <div class="role-meta"><em>05/2024 - Present</em><em>Remote</em></div>
        <ul>
          <li>
            Owned end-to-end development of a full-stack client dashboard using
            <strong>React, Node.js, and TypeScript</strong>, delivering
            real-time insights and reducing client reporting overhead by
            <strong>25%.</strong>
          </li>
          <li>
            Designed and maintained <strong>backend APIs</strong> using
            <strong>Hono and Next.js</strong>, implementing authentication,
            role-based access control, and secure data flows.
          </li>
          <li>
            Built and deployed
            <strong>serverless backends on Cloudflare Workers</strong>, ensuring
            low-latency performance and high availability.
          </li>
          <li>
            Collaborated closely with stakeholders to translate business
            requirements into scalable technical solutions.
          </li>
        </ul>
      </article>
      <article class="role">
        <h3>Software Development Engineer 1</h3>
        <p class="company">UnOrg Vendor Solutions</p>
        <div class="role-meta"><em>12/2022 - 10/2023</em><em>Lucknow</em></div>
        <ul>
          <li>
            Designed and developed
            <strong>full-stack vendor management tools</strong> using
            <strong>React, TypeScript, Node.js, and Django.</strong>
          </li>
          <li>
            Led dashboard development with <strong>Next.js</strong>, focusing on
            performance optimization for data visualization and reporting
            features.
          </li>
          <li>
            Worked directly with non-technical stakeholders to refine workflows
            and deliver business-critical features.
          </li>
        </ul>
      </article>
      <article class="role">
        <h3>JavaScript Developer</h3>
        <p class="company">Solvative</p>
        <div class="role-meta"><em>05/2024 - Present</em><em>Remote</em></div>
        <ul>
          <li>
            Owned end-to-end development of a full-stack client dashboard using
            <strong>React, Node.js, and TypeScript</strong>, delivering
            real-time insights and reducing client reporting overhead by
            <strong>25%.</strong>
          </li>
          <li>
            Designed and maintained <strong>backend APIs</strong> using
            <strong>Hono and Next.js</strong>, implementing authentication,
            role-based access control, and secure data flows.
          </li>
          <li>
            Built and deployed
            <strong>serverless backends on Cloudflare Workers</strong>, ensuring
            low-latency performance and high availability.
          </li>
          <li>
            Collaborated closely with stakeholders to translate business
            requirements into scalable technical solutions.
          </li>
        </ul>
      </article>
      <article class="role">
        <h3>Software Development Engineer 1</h3>
        <p class="company">UnOrg Vendor Solutions</p>
        <div class="role-meta"><em>12/2022 - 10/2023</em><em>Lucknow</em></div>
        <ul>
          <li>
            Designed and developed
            <strong>full-stack vendor management tools</strong> using
            <strong>React, TypeScript, Node.js, and Django.</strong>
          </li>
          <li>
            Led dashboard development with <strong>Next.js</strong>, focusing on
            performance optimization for data visualization and reporting
            features.
          </li>
          <li>
            Worked directly with non-technical stakeholders to refine workflows
            and deliver business-critical features.
          </li>
        </ul>
      </article>
      <article class="role">
        <h3>Junior Programmer</h3>
        <p class="company">Rozgaar India</p>
        <div class="role-meta"><em>06/2022 - 11/2022</em><em>Lucknow</em></div>
        <ul>
          <li>
            Developed and optimized <strong>backend modules</strong> using
            <strong>Django and MySQL</strong>, including REST APIs and
            authentication flows for a sales-warehouse management system.
          </li>
          <li>
            Improved system efficiency, contributing to a
            <strong>40% increase in sales efficiency</strong> and reduced
            warehousing overhead.
          </li>
          <li>
            Built and integrated
            <strong>third-party APIs and OAuth-based integrators</strong> (Meta,
            LinkedIn, YouTube, X) for unified analytics and automation.
          </li>
        </ul>
      </article>
      <article class="role compact">
        <h3>Web Development Intern</h3>
        <p class="company">Tamasha.live</p>
        <div class="role-meta"><em>12/2021 - 03/2022</em><em>Remote</em></div>
      </article>
      <article class="role compact">
        <h3>UI Developer Intern</h3>
        <p class="company">TrendAI</p>
        <div class="role-meta"><em>05/2021 - 11/2021</em><em>Remote</em></div>
      </article>
    </section>

    <aside class="details-column">
      <section>
        <h2>Skills</h2>
        <div class="skill-list">
          <span>Node.js</span><span>ReactJS</span><span>JavaScript</span
          ><span>TypeScript</span><span>Express.js</span><span>HonoJS</span
          ><span>Python</span><span>Next.js</span><span>Shadcn/UI</span
          ><span>Zustand</span><span>PostgreSQL</span><span>MySQL</span
          ><span>MongoDB</span><span>Django</span><span>Supabase</span
          ><span>Cloudflare</span><span>AWS</span><span>Docker</span
          ><span>CI/CD</span><span>Git</span><span>VSCode</span
          ><span>API Design</span><span>REST APIs</span><span>GraphQL</span
          ><span>OAuth</span><span>JWT</span><span>System Design</span
          ><span>Linux</span>
        </div>
      </section>
      <section>
        <h2>Skills</h2>
        <div class="skill-list">
          <span>Node.js</span><span>ReactJS</span><span>JavaScript</span
          ><span>TypeScript</span><span>Express.js</span><span>HonoJS</span
          ><span>Python</span><span>Next.js</span><span>Shadcn/UI</span
          ><span>Zustand</span><span>PostgreSQL</span><span>MySQL</span
          ><span>MongoDB</span><span>Django</span><span>Supabase</span
          ><span>Cloudflare</span><span>AWS</span><span>Docker</span
          ><span>CI/CD</span><span>Git</span><span>VSCode</span
          ><span>API Design</span><span>REST APIs</span><span>GraphQL</span
          ><span>OAuth</span><span>JWT</span><span>System Design</span
          ><span>Linux</span>
        </div>
      </section>
      <section>
        <h2>Personal Projects</h2>
        <article class="project">
          <h3>HiredToBe <small>(10/2025 - Present)</small></h3>
          <ul>
            <li>
              End-to-end <strong>full-stack job tracking platform</strong> built
              using
              <strong
                >React, TypeScript, Hono, and serverless architecture.</strong
              >
            </li>
            <li>
              Designed REST APIs, database schema, and frontend UI for managing
              job applications workflows, and interviews.
            </li>
            <li>
              Implemented modern tooling including
              <strong>monorepo setup, Drizzle ORM, and Cloudflare D1.</strong>
            </li>
          </ul>
        </article>
        <article class="project">
          <h3>PennyWise <small>(12/2025 - 01/2026)</small></h3>
          <ul>
            <li>
              Built a <strong>local-first PWA</strong> for personal finance
              tracking using <strong>SolidJS, TailwindCSS, and Vite.</strong>
            </li>
            <li>
              Designed offline-first data flows with optional cloud sync,
              focusing on performance and reliability.
            </li>
          </ul>
        </article>
        <article class="project">
          <h3>VS Code Extensions <small>(Wrap It, Dr Text, REMify)</small></h3>
          <ul>
            <li>
              Designed, built, and published multiple
              <strong>VS Code extensions</strong> used by developers to improve
              workflow.
            </li>
            <li>Focused on performance, UX, and developer productivity.</li>
            <li>Actively maintained with real-world users and feedback.</li>
            <li>Combined <strong>7K+ installs</strong> across extensions.</li>
          </ul>
        </article>
      </section>
      <section class="certifications">
        <h2>Certifications</h2>
        <h3>
          Stripe Associate Architect Certification <small>(2025 - 2027)</small>
        </h3>
        <p>
          <em
            >A Stripe Certified Associate Architect can assess business needs
            and propose Stripe products and best practices for typical business
            use cases.</em
          >
        </p>
      </section>
    </aside>
  </div>
</main>
`

export const starterCss = `@page {
  size: A4;
  margin: 0;
}
:root {
  color: #111;
  font-family: Arial, Helvetica, sans-serif;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: #fff;
}
.resume {
  width: 210mm;
  min-height: 297mm;
  padding: 8mm;
  margin: 0 auto;
  background: #fff;
}
.resume-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 42%);
  gap: 6mm;
  padding-bottom: 4mm;
  border-bottom: 1.5px solid #344054;
}
.identity {
  display: flex;
  flex-direction: column;
  gap: 2mm;
}
.portrait-block {
  width: 9mm;
  height: 13mm;
  margin-top: 3px;
  background: #344054;
}
h1 {
  margin: 0;
  color: #344054;
  font-size: 25px;
  font-weight: 400;
  line-height: 1.1;
}
.role-title {
  margin: 0;
  color: #3d9aa3;
  font-size: 16px;
}
.summary {
  max-width: 112mm;
  margin: 0;
  font-size: 10.2px;
  line-height: 1.34;
}
.contact {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 2.5mm;
  padding-top: 2px;
  text-align: right;
  font-size: 10.5px;
}
.contact a {
  color: #111;
  text-decoration: none;
  overflow-wrap: anywhere;
}
.contact-icon {
  display: inline-grid;
  width: 15px;
  margin-left: 8px;
  place-items: center;
  color: #344054;
  font-weight: 700;
}
.resume-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 6mm;
}
.experience-column {
  padding-top: 5mm;
}
.details-column {
  min-width: 0;
  padding-top: 5mm;
}
h2 {
  margin: 0 0 3.5mm;
  color: #050505;
  font-size: 15.5px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}
.experience-column h2 {
  margin-bottom: 3.5mm;
}
.role {
  position: relative;
  min-width: 0;
  margin: 0 0 5mm;
  padding-left: 2.5mm;
}
.role::before {
  position: absolute;
  top: -2px;
  left: -8mm;
  width: 4mm;
  height: 13mm;
  background: #48a2a9;
  content: "";
}
.role h3,
.project h3,
.certifications h3 {
  margin: 0;
  color: #080808;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.08;
}
.company {
  margin: 1px 0 3px;
  font-size: 14px;
  line-height: 1;
}
.role-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
  color: #3d9aa3;
  font-size: 10.5px;
}
.role ul,
.project ul {
  margin: 0;
  padding-left: 4mm;
}
li {
  margin: 0 0 2px;
  font-size: 10.5px;
  line-height: 1.22;
}
li::marker {
  color: #48a2a9;
  font-size: 1.1em;
}
.role.compact {
  margin-bottom: 5mm;
}
.details-column > section {
  margin-bottom: 9mm;
}
.details-column h2 {
  margin-bottom: 4mm;
}
.skill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 5px;
}
.skill-list span {
  padding: 5px 7px;
  border-radius: 4px;
  color: #fff;
  background: #344054;
  font-size: 10px;
  line-height: 1;
}
.project {
  margin-bottom: 5mm;
}
.project h3 small,
.certifications h3 small {
  font-size: 10.5px;
  font-weight: 400;
}
.project ul {
  margin-top: 2px;
}
.certifications p {
  margin: 4px 0 0;
  color: #777;
  font-size: 10px;
  line-height: 1.2;
}
@media print {
  body {
    margin: 0;
  }
  .resume {
    margin: 0;
  }
  .resume-header,
  .role,
  .details-column > section {
    break-inside: avoid;
  }
}
`

export const blankHtml = '<main class="resume"></main>'

export const blankCss = `@page {
  size: A4;
  margin: 0;
}

html,
body {
  margin: 0;
  min-height: 297mm;
}

.resume {
  box-sizing: border-box;
  min-height: 297mm;
  padding: 18mm;
  color: #173a40;
  font: 400 14px/1.5 Manrope, Arial, sans-serif;
}
`

function createDocument(
  name: string,
  html: string,
  css: string,
): ResumeDocument {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    html,
    css,
    createdAt: now,
    updatedAt: now,
  }
}

export function createStarterDocument(name = 'My Resume'): ResumeDocument {
  return createDocument(name, starterHtml, starterCss)
}

export function createBlankDocument(name = 'Untitled Resume'): ResumeDocument {
  return createDocument(name, blankHtml, blankCss)
}
