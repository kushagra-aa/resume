import { createFileRoute } from '@tanstack/react-router'

import { ResumeEditor } from '#/features/editor/components/resume-editor'

export const Route = createFileRoute('/editor/$resumeId')({
  component: EditorRoute,
})

function EditorRoute() {
  return <ResumeEditor />
}
