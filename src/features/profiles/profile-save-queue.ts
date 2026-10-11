import type { Profile } from '#/models/profile'

export class ProfileSaveQueue {
  private pending = Promise.resolve()

  constructor(
    private readonly update: (profile: Profile) => Promise<unknown>,
  ) {}

  save(profile: Profile) {
    const task = this.pending.then(() =>
      this.update(profile).then(() => undefined),
    )
    this.pending = task.catch(() => undefined)
    return task
  }

  flush() {
    return this.pending
  }
}
