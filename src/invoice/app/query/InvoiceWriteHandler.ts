import { BrokerEvent } from "../../../packages/eventSourcing/eventBroker.types"
import { DataStore } from "../../../packages/db/testDB"
import { InvoiceBilledEvent, InvoiceCreatedEvent, InvoiceOrderAddedEvent } from "../../domain/InvoiceChangeEvents"
import { InvoiceT } from "../../domain/Invoice"
import { Versioned } from "../../../packages/eventSourcing/applyVersion"

export class InvoiceWriteEvents {
  isCreated(event: BrokerEvent): event is Versioned<InvoiceCreatedEvent> {
    return event.type === "invoiceCreated"
  }

  isOrderAdded(event: BrokerEvent): event is Versioned<InvoiceOrderAddedEvent> {
    return event.type === "orderAdded"
  }

  isBilled(event: BrokerEvent): event is Versioned<InvoiceBilledEvent> {
    return event.type === "invoiceBilled"
  }
}

export type WriteHandlerT = {
  handle(events: BrokerEvent[]): Promise<void>
}
export class InvoiceWriteHandler implements WriteHandlerT {
  constructor(
    private readonly event: InvoiceWriteEvents,
    private readonly db: DataStore<Versioned<InvoiceT>>, // same as above for type
  ) {}

  async handle(events: BrokerEvent[]) {
    for await (const event of events) {
      if (this.event.isCreated(event)) await this.applyCreate(event)
      if (this.event.isOrderAdded(event)) await this.applyOrderAdded(event)
      if (this.event.isBilled(event)) await this.applyBilled(event)
    }
  }

  async applyCreate(event: Versioned<InvoiceCreatedEvent>) {
    const invoice = {
      ...event.data,
      version: event.version,
    }
    await this.db.create(invoice)
  }

  async applyOrderAdded(event: Versioned<InvoiceOrderAddedEvent>) {
    const invoice = await this.db.get(event.aggregateId)
    await this.db.update({
      ...invoice,
      version: event.version,
      orders: [...invoice.orders, event.data.order],
    })
    console.log("invoice updated", invoice.id)
  }

  async applyBilled(event: Versioned<InvoiceBilledEvent>) {
    const invoice = await this.db.get(event.aggregateId)
    invoice.status = "billed"
    await this.db.update({
      ...invoice,
      version: event.version,
      status: event.data.status,
    })
  }
}
