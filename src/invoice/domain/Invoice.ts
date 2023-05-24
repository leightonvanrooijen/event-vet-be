import { InvoiceChangeEvents, InvoiceEvents } from "./InvoiceChangeEvents"
import { InvoiceRepo } from "../infra/InvoiceRepo"
import { InvoiceHydrator } from "./InvoiceHydrator"
import { InvoiceApplier } from "./InvoiceApplier"
import { createUuid, Uuid } from "../../packages/uuid/uuid.types"
import { GoodRepo } from "../infra/goodRepo"
import { IGood } from "../app/inEvents/IProductService"

export type UnPricedOffer = {
  goodOffered: IGood
  typeOfGood: "product"
  quantity: number
  businessFunction: "sell"
}

export type InvoiceOffer = UnPricedOffer & { price: number }

export type UnPricedOrder = {
  type: "procedure"
  aggregateId: string
  name: string
  offers: UnPricedOffer[]
}

export type InvoiceOrder = {
  type: "procedure"
  aggregateId: string
  name: string
  offers: InvoiceOffer[]
}

export type InvoiceStatuses = "draft" | "billed"
export type InvoiceT = {
  id: string
  customerId: string
  orders: InvoiceOrder[]
  status: InvoiceStatuses
}

export class Invoice {
  constructor(
    private readonly repo: InvoiceRepo,
    private readonly event: InvoiceChangeEvents,
    private readonly applier: InvoiceApplier,
    private readonly hydrator: InvoiceHydrator,
    private readonly goodRepo: GoodRepo,
    private readonly uuid: Uuid = createUuid,
  ) {}
  create(customerId: string) {
    const invoice = this.applier.create(this.uuid(), customerId)
    return this.event.created(this.uuid(), customerId, invoice.orders, invoice.status)
  }

  async addOrder(state: InvoiceT, unPricedOrder: UnPricedOrder) {
    if (state.status === "billed") throw new Error("Cannot add order to billed invoice")
    if (!unPricedOrder) throw new Error("Orders must contain at least one good")

    const foundIndex = state.orders.findIndex((contained) => contained.aggregateId === unPricedOrder.aggregateId)
    if (foundIndex >= 0) throw new Error("Order is already on the invoice")

    const offers = unPricedOrder.offers.map((offer) => {
      return {
        ...offer,
        price: offer.goodOffered.price * offer.quantity,
      }
    })

    const order = { ...unPricedOrder, offers }

    const invoice = this.applier.addOrder(state, order)
    return this.event.orderAdded(invoice.id, order)
  }

  bill(state: InvoiceT) {
    if (state.status === "billed") throw new Error("Cannot bill an already billed invoice")
    const invoice = this.applier.bill(state)
    return this.event.billed(invoice.id)
  }

  async hydrate(id: string) {
    const events = await this.repo.get(id)
    return this.hydrator.hydrate(events)
  }

  async persist(events: InvoiceEvents[], expectedVersion: number) {
    return this.repo.save(events, expectedVersion)
  }
}
