import { createFileRoute } from '@tanstack/react-router'

import { ProfileEditor } from '#/features/profiles/components/profile-editor'

export const Route = createFileRoute('/profiles/$profileId')({
  component: ProfileRoute,
})

function ProfileRoute() {
  const { profileId } = Route.useParams()
  return <ProfileEditor profileId={profileId} />
}
