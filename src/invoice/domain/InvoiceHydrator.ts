import { InvoiceChangeEvents, InvoiceEvents } from "./InvoiceChangeEvents"
import { InvoiceT } from "./Invoice"
import { InvoiceApplier } from "./InvoiceApplier"

export class InvoiceHydrator {
  constructor(private readonly event: InvoiceChangeEvents, private readonly applier: InvoiceApplier) {}

  hydrate(events: InvoiceEvents[]): InvoiceT {
    return events.reduce((state, event) => {
      if (this.event.isCreated(event)) {
        return this.applier.create(event.data.id, event.data.customerId)
      }
      if (this.event.isOrderAdded(event)) {
        return this.applier.addOrder(state, event.data.order)
      }
      if (this.event.isBilled(event)) {
        return this.applier.bill(state)
      }
      return state
    }, {} as InvoiceT)
  }
}
