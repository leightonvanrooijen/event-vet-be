import { Invoice, OrderWithoutPricing } from "../../domain/Invoice"

export class InvoiceService {
  constructor(private readonly invoice: Invoice) {}

  async create(customerId: string) {
    const event = await this.invoice.create(customerId)
    await this.invoice.persist([event], 0)

    return event.aggregateId
  }

  async addOrder(id: string, order: OrderWithoutPricing, expectedVersion: number) {
    const state = await this.invoice.hydrate(id)
    const event = await this.invoice.addOrder(state, order)
    await this.invoice.persist([event], expectedVersion)
  }

  async bill(id: string, expectedVersion: number) {
    const state = await this.invoice.hydrate(id)
    const event = this.invoice.bill(state)
    await this.invoice.persist([event], expectedVersion)
  }
}
