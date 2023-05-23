import { InvoiceOrder, InvoiceStatuses, InvoiceType } from "./Invoice"
import { ChangeEvent } from "../../packages/eventSourcing/changeEvent.types"

export type InvoiceCreatedEvent = ChangeEvent<InvoiceType>
export type InvoiceOrderAddedEvent = ChangeEvent<{ order: InvoiceOrder }>
export type InvoiceBilledEvent = ChangeEvent<{ id: string }>
export type InvoiceEvents = InvoiceCreatedEvent | InvoiceOrderAddedEvent | InvoiceBilledEvent

export class InvoiceChangeEvents {
  created(id: string, customerId: string, orders: InvoiceOrder[], status: InvoiceStatuses): InvoiceCreatedEvent {
    return {
      type: "invoiceCreated",
      aggregateId: id,
      data: {
        id,
        customerId,
        orders,
        status,
      },
    }
  }

  billed(id: string): InvoiceBilledEvent {
    return {
      type: "invoiceBilled",
      aggregateId: id,
      data: {
        id,
      },
    }
  }

  orderAdded(id: string, order: InvoiceOrder): InvoiceOrderAddedEvent {
    return {
      type: "orderAdded",
      aggregateId: id,
      data: {
        order,
      },
    }
  }

  isCreated(event: InvoiceEvents): event is InvoiceCreatedEvent {
    return event.type === "invoiceCreated"
  }

  isBilled(event: InvoiceEvents): event is InvoiceBilledEvent {
    return event.type === "invoiceBilled"
  }

  isOrderAdded(event: InvoiceEvents): event is InvoiceOrderAddedEvent {
    return event.type === "invoiceOrderAdded"
  }
}
