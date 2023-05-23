import { Invoice } from "../../domain/Invoice"
import { GoodService } from "./GoodService"
import { RequestedOrder } from "./command.types"

export class InvoiceService {
  constructor(private readonly invoice: Invoice, private readonly goodService: GoodService) {}

  async create(customerId: string) {
    const event = await this.invoice.create(customerId)
    await this.invoice.persist([event], 0)

    return event.aggregateId
  }

  async addOrder(id: string, partialOrder: RequestedOrder, expectedVersion: number) {
    const state = await this.invoice.hydrate(id)
    const order = await this.goodService.addNameAndPricing(partialOrder)
    const event = await this.invoice.addOrder(state, order)
    await this.invoice.persist([event], expectedVersion)
  }

  async bill(id: string, expectedVersion: number) {
    const state = await this.invoice.hydrate(id)
    const event = this.invoice.bill(state)
    await this.invoice.persist([event], expectedVersion)
  }
}
