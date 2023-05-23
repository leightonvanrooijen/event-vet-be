import { throwIfEmpty } from "../../packages/utils"
import { InvoiceOrder, InvoiceStatuses, InvoiceType } from "./Invoice"

export class InvoiceApplier {
  make(id: string, customerId: string, orders: InvoiceOrder[], status: InvoiceStatuses): InvoiceType {
    throwIfEmpty(id, "An Invoice must contain an ID")
    throwIfEmpty(customerId, "An Invoice must contain an customerId")
    if (!Array.isArray(orders)) throw new Error("An Invoice order must be an array")
    throwIfEmpty(status, "An Invoice must contain a status")

    return {
      id,
      customerId,
      orders,
      status: status,
    }
  }

  create(id: string, customerId: string): InvoiceType {
    return this.make(id, customerId, [], "draft")
  }

  bill(invoice: InvoiceType): InvoiceType {
    return this.make(invoice.id, invoice.customerId, invoice.orders, "billed")
  }

  addOrder(invoice: InvoiceType, order: InvoiceOrder): InvoiceType {
    return { ...invoice, orders: [...invoice.orders, order] }
  }
}
