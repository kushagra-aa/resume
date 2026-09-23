# ResuMe Agent Guide

## Project purpose

ResuMe is a local-first, open-source resume maker. The current product stage is a proof of concept (POC) for a customizable HTML/CSS resume workflow:

```text
edit HTML + CSS -> live A4 preview -> save locally -> export source / print to PDF
```

The user's HTML and CSS are the source of truth. The project should preserve user control, produce machine-readable output, and avoid fabricating resume content.

The product requirements live in [`docs/ProjectOverview.md`](docs/ProjectOverview.md) and [`docs/POC.md`](docs/POC.md). Read those documents before making product or architectural changes.

## POC boundaries

The POC includes:

- HTML and CSS code editing with syntax-aware editors.
- Immediate live preview of the edited source.
- An isolated preview surface where user-controlled HTML/CSS cannot access application state unnecessarily.
- A4 page presentation, page boundaries, zoom, and multi-page content where practical.
- Local-only create, edit, save, load, rename, delete, and autosave behavior.
- Separate HTML/CSS source export.
- Browser print/PDF output with print-only application chrome hidden.
- One polished, editable starter resume demonstrating summary, experience, projects, skills, education, and contact details.

Keep the POC intentionally small. Do not add accounts, cloud sync, collaboration, ATS analysis, resume scoring, AI/BYOK, template systems, a final structured resume schema, job application features, or additional export formats unless the project requirements are explicitly changed.

## Tech stack and commands

- TypeScript, React 19, TanStack Start, TanStack Router, Vite, and pnpm.
- Tailwind CSS v4 with the existing CSS design tokens; use Shadcn/Radix primitives where they improve the UI.
- Dexie/IndexedDB or localStorage for local persistence; choose the simplest reliable option for the POC.
- Zustand and Zod are available for state and validation when needed, but do not introduce abstractions without a concrete use.
- Cloudflare/Vite deployment is configured, but the POC must remain functional without a backend.

Useful commands:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm check
pnpm format
pnpm deploy
```

Use `pnpm build`, `pnpm lint`, and `pnpm check` after meaningful changes. If a change affects persistence, preview, export, printing, or editor behavior, manually verify the relevant browser flow as well.

## Repository layout

- `src/routes/`: TanStack Router file-based routes. Add routes here; do not hand-edit `src/routeTree.gen.ts`.
- `src/components/`: shared UI components, including future Shadcn components.
- `src/features/`: feature-specific implementation such as resume, editor, and preview.
- `src/models/`: domain types, including the intentionally simple POC `ResumeDocument` shape.
- `src/schemas/`: runtime validation schemas when persisted data needs validation.
- `src/db/`: local persistence client, schema, and repositories.
- `src/stores/`: shared client state; keep transient editor state separate from persisted resume data where useful.
- `src/lib/`: generic utilities only; feature logic belongs under its feature.
- `src/styles.css`: global styles and design tokens. Preserve the existing visual language unless a deliberate redesign is requested.
- `docs/`: product requirements and POC definition of done.

The repository is currently still close to the TanStack Start starter. Treat the docs as the target behavior, not as evidence that every listed feature has already been implemented.

## Implementation conventions

- Prefer small, typed React components and feature-local modules over large route components.
- Use the `#/*` or `@/*` aliases for imports from `src` where appropriate.
- Keep TypeScript strictness intact. Avoid `any`, unused values, and unnecessary type assertions.
- Follow the existing Prettier style: no semicolons, single quotes, and trailing commas.
- Keep browser-only APIs such as `window`, `document`, IndexedDB, and `localStorage` behind client-safe boundaries. Account for SSR/hydration in TanStack Start.
- Validate persisted data before using it. Handle missing, malformed, or older local data without crashing the application.
- Debounce autosave and preview work when needed, but keep the edit-to-preview interaction immediate from the user's perspective.
- Keep user HTML/CSS isolated from the app where appropriate, preferably using a sandboxed iframe. Do not interpolate user source into application JSX.
- Export the actual source the user edited. Do not silently transform it into a new structured schema.
- Keep print CSS separate and ensure application controls/devtools are excluded from printed output.
- Use accessible labels, keyboard-operable controls, visible focus states, and useful empty/error states.
- Do not add a dependency when the existing stack or a small local utility is sufficient.

## TanStack Router rules

- Create or update route files under `src/routes/`.
- After route changes, run `pnpm generate-routes` if the generated tree is not updated automatically.
- Never manually edit `src/routeTree.gen.ts`; it is generated and marked read-only in the editor configuration.
- Keep global document metadata and shared shell behavior in `src/routes/__root.tsx`.

## Definition of done for the POC

Consider the POC complete only when a fresh clone can run locally and a user can:

1. Create or open a resume.
2. Edit HTML and CSS with a live preview.
3. Refresh the browser without losing saved work.
4. Rename/delete and reload locally stored resumes.
5. Export `resume.html` and `resume.css`.
6. Print a visually matching, selectable-text, multi-page PDF from the browser.

When requirements are ambiguous, use the POC boundary question from `docs/POC.md`: does the change prove that customizable HTML/CSS, live preview, local persistence, and document output are a viable foundation for ResuMe? If not, defer it.
