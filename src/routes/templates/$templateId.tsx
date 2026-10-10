import { createFileRoute } from '@tanstack/react-router'

import { CustomTemplateEditor } from '#/features/templates/custom-template-editor'

export const Route = createFileRoute('/templates/$templateId')({
  component: TemplateEditorRoute,
})

function TemplateEditorRoute() {
  const { templateId } = Route.useParams()
  return <CustomTemplateEditor templateId={templateId} />
}
