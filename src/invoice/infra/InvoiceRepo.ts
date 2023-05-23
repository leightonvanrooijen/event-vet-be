import { EventDb } from "../../packages/eventSourcing/testEventDb"

import { InvoiceEvents } from "../domain/InvoiceChangeEvents"

export class InvoiceRepo {
  constructor(private readonly db: EventDb<InvoiceEvents>) {}

  async save(events: InvoiceEvents[], expectedVersion: number) {
    return this.db.saveEvents(events, expectedVersion)
  }

  async get(aggregateId: string) {
    const events = await this.db.getEvents(aggregateId)
    if (!events.length) throw new Error("Invoice not found")
    return events
  }
}
