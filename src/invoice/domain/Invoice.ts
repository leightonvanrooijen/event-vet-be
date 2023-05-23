import { Product } from "../../procedure/app/externalEvents/externalEventHandler"
import { InvoiceChangeEvents, InvoiceEvents } from "./InvoiceChangeEvents"
import { InvoiceRepo } from "../infra/InvoiceRepo"
import { InvoiceHydrator } from "./InvoiceHydrator"
import { InvoiceApplier } from "./InvoiceApplier"
import { createUuid, Uuid } from "../../packages/uuid/uuid.types"
import { GoodRepo } from "../infra/goodRepo"

export type InvoiceOffer = {
  goodOffered: Product
  typeOfGood: "product"
  price: number
  quantity: number
  businessFunction: "sell" // | "lease"
}

export type InvoiceOrder = {
  type: "procedure"
  aggregateId: string
  name: string
  offers: InvoiceOffer[]
}

export type InvoiceStatuses = "draft" | "billed"
export type InvoiceType = {
  id: string
  customerId: string
  orders: InvoiceOrder[]
  status: InvoiceStatuses
}

// fix this up to be composed
export type OfferWithoutPricingAndName = {
  goodOffered: { id: string }
  typeOfGood: "product"
  quantity: number
  businessFunction: "sell"
}
export type OrderWithoutPricing = {
  type: "procedure"
  aggregateId: string
  name: string
  offers: OfferWithoutPricingAndName[]
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

  async addOrder(state: InvoiceType, orderWithoutPricing: OrderWithoutPricing) {
    if (state.status === "billed") throw new Error("Cannot add order to billed invoice")
    if (!orderWithoutPricing) throw new Error("Orders must contain at least one good")

    const foundIndex = state.orders.findIndex((contained) => contained.aggregateId === orderWithoutPricing.aggregateId)
    if (foundIndex >= 0) throw new Error("Order is already on the invoice")

    //  extract this out into it's own object
    const goodIds = orderWithoutPricing.offers.map((offer) => offer.goodOffered.id)
    const goods = await this.goodRepo.getByIds(goodIds)
    const offersWithPricing: InvoiceOffer[] = orderWithoutPricing.offers.map((offer) => {
      const good = goods.find((good) => good.id === offer.goodOffered.id)
      return {
        ...offer,
        price: good.price * offer.quantity,
        goodOffered: {
          id: good.id,
          name: good.name,
          price: good.price,
          type: good.type,
        },
      }
    })
    const orderWithPricing = { ...orderWithoutPricing, offers: offersWithPricing }

    const invoice = this.applier.addOrder(state, orderWithPricing)
    const event = this.event.orderAdded(invoice.id, orderWithPricing)
    return event
  }

  bill(state: InvoiceType) {
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
