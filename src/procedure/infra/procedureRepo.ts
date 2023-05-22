import { EventDb } from "../../packages/eventSourcing/testEventDb"

import { ProcedureEvents } from "../domain/procedure.changeEvents"

export class ProcedureRepo {
  constructor(private readonly db: EventDb<ProcedureEvents>) {}

  async save(events: ProcedureEvents[], expectedVersion: number) {
    return this.db.saveEvents(events, expectedVersion)
  }

  async get(aggregateId: string) {
    const events = await this.db.getEvents(aggregateId)
    if (!events.length) throw new Error("Procedure not found")
    return events
  }
}
