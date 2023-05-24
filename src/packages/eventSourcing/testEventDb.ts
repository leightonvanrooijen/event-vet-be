import { ChangeEvent } from "./changeEvent.types"
import { EventBus } from "./eventBus"

export type EventDb<Event extends Record<string, any>> = {
  saveEvents(events: Event[], expectedVersion: number): Promise<void>
  getEvents(id: string): Promise<Event[]>
}

export type VersionedChangeEvent<T extends Record<string, any>> = ChangeEvent<T> & { version: number }
export type EventStore<Event extends VersionedChangeEvent<any>> = Record<string, Event[]>

export class TestEventDb implements EventDb<VersionedChangeEvent<any>> {
  constructor(
    private eventBroker: EventBus = new EventBus(),
    private store: EventStore<VersionedChangeEvent<any>> = {},
  ) {}
  async saveEvents(events, expectedVersion) {
    const aggregateId = events[0].aggregateId
    const currentVersion = getCurrentVersion(this.store[aggregateId])
    if (currentVersion !== expectedVersion)
      throw new Error(`version is not incremental, current ${currentVersion}, expected ${expectedVersion}`)

    if (!aggregateExistsInStore(this.store, aggregateId)) {
      this.store[aggregateId] = versionEvents(events, currentVersion)
      await this.eventBroker.process(versionEvents(events, currentVersion))
      return Promise.resolve()
    }

    this.store[aggregateId] = [...this.store[aggregateId], ...versionEvents(events, currentVersion)]
    await this.eventBroker.process(versionEvents(events, currentVersion))
    return Promise.resolve()
  }
  async getEvents(id) {
    if (!this.store[id]) return []

    return this.store[id]
  }
}

function aggregateExistsInStore(store: EventStore<any>, id: string) {
  return Boolean(store[id])
}

function versionEvents(events: ChangeEvent<any>[], currentVersion: number): VersionedChangeEvent<any>[] {
  return events.map((event, index) => ({ ...event, version: currentVersion + index + 1 }))
}
function getCurrentVersion(events: VersionedChangeEvent<any>[]) {
  if (!events || events?.length === 0) return 0
  return events[events.length - 1].version
}
