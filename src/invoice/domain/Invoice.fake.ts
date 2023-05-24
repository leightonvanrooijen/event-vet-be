import { Product } from "../../procedure/app/externalEvents/PInEventHandler"
import { faker } from "@faker-js/faker"
import { InvoiceOffer, InvoiceOrder, InvoiceT, UnPricedOffer, UnPricedOrder } from "./Invoice"
import { makeFakes } from "../../packages/eventSourcing/changeEvent.fake"
import { InvoiceBilledEvent, InvoiceCreatedEvent, InvoiceOrderAddedEvent } from "./InvoiceChangeEvents"
import { requestedOrderFake } from "../app/command/command.fake"
import { IGood } from "../app/inEvents/IProductService"

export const goodFake = (overrides?: Partial<Product>): IGood => ({
  id: faker.datatype.uuid(),
  name: faker.commerce.productName(),
  price: Number(faker.commerce.price()),
  type: "product",
  ...overrides,
})

export const offerFake = (overrides?: Partial<InvoiceOffer>): InvoiceOffer => ({
  typeOfGood: "product",
  quantity: faker.datatype.number(),
  businessFunction: "sell",
  goodOffered: goodFake(overrides?.goodOffered),
  price: faker.datatype.number(),
  ...overrides,
})

export const offerFakes = makeFakes(offerFake)

export const unPricedOfferFake = (overrides?: Partial<UnPricedOffer>): UnPricedOffer => ({
  typeOfGood: "product",
  quantity: faker.datatype.number(),
  businessFunction: "sell",
  goodOffered: goodFake(overrides?.goodOffered),
  ...overrides,
})

export const orderFake = (overrides?: Partial<InvoiceOrder>): InvoiceOrder => ({
  ...unPricedOrderFake(overrides),
  offers: offerFakes(3),
  ...overrides,
})

export const orderFakes = makeFakes(orderFake)

export const unPricedOrderFake = (overrides?: Partial<UnPricedOrder>): UnPricedOrder => ({
  ...requestedOrderFake(overrides),
  offers: offerFakes(3).map((offer) => ({ ...offer, goodOffered: goodFake() })),
  ...overrides,
})

export const invoiceFake = (overrides?: Partial<InvoiceT>): InvoiceT => ({
  id: faker.datatype.uuid(),
  customerId: faker.datatype.uuid(),
  orders: orderFakes(2),
  status: faker.helpers.arrayElement(["draft", "billed"]),
  ...overrides,
})

export const invoiceCreatedEventFake = (overrides?: Partial<InvoiceCreatedEvent>): InvoiceCreatedEvent => ({
  type: "invoiceCreated",
  aggregateId: faker.datatype.uuid(),
  data: invoiceFake(),
  ...overrides,
})

export const orderAddedEventFake = (overrides?: Partial<InvoiceOrderAddedEvent>): InvoiceOrderAddedEvent => ({
  type: "orderAdded",
  aggregateId: faker.datatype.uuid(),
  data: { order: orderFake() },
  ...overrides,
})

export const invoiceBilledEventFake = (overrides?: Partial<InvoiceBilledEvent>): InvoiceBilledEvent => ({
  type: "invoiceBilled",
  aggregateId: faker.datatype.uuid(),
  data: { status: "billed" },
  ...overrides,
})

export const invoiceEventFakes = (id: string) => {
  const invoice = invoiceFake({ id })
  return [
    invoiceCreatedEventFake({ aggregateId: invoice.id, data: invoice }),
    orderAddedEventFake({ aggregateId: invoice.id }),
    invoiceBilledEventFake({ aggregateId: invoice.id }),
  ]
}
