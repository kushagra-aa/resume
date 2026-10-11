import { describe, expect, it } from 'vitest'

import { ProfileSaveQueue } from '#/features/profiles/profile-save-queue'
import { completeProfileFixture } from './fixtures/structured-render-fixtures'

describe('ProfileSaveQueue', () => {
  it('serializes saves so the newest snapshot is always written last', async () => {
    const writes: string[] = []
    let releaseFirst: (() => void) | undefined
    const queue = new ProfileSaveQueue(async (profile) => {
      if (writes.length === 0)
        await new Promise<void>((resolve) => {
          releaseFirst = resolve
        })
      writes.push(profile.name)
    })
    const first = { ...completeProfileFixture, name: 'First edit' }
    const second = { ...completeProfileFixture, name: 'Latest edit' }

    const firstSave = queue.save(first)
    const secondSave = queue.save(second)
    await Promise.resolve()
    releaseFirst?.()
    await Promise.all([firstSave, secondSave, queue.flush()])

    expect(writes).toEqual(['First edit', 'Latest edit'])
  })

  it('continues saving after one write fails', async () => {
    const writes: string[] = []
    const queue = new ProfileSaveQueue(async (profile) => {
      if (profile.name === 'Fail') throw new Error('storage unavailable')
      writes.push(profile.name)
    })

    await expect(
      queue.save({ ...completeProfileFixture, name: 'Fail' }),
    ).rejects.toThrow('storage unavailable')
    await queue.save({ ...completeProfileFixture, name: 'Retry' })
    await queue.flush()

    expect(writes).toEqual(['Retry'])
  })
})
