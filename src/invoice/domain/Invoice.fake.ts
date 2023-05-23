import { Product } from "../../procedure/app/externalEvents/externalEventHandler"
import { faker } from "@faker-js/faker"
import { InvoiceOffer, InvoiceOrder, InvoiceType, OfferWithoutPricingAndName, OrderWithoutPricing } from "./Invoice"
import { makeFakes } from "../../packages/eventSourcing/changeEvent.fake"
import { InvoiceBilledEvent, InvoiceCreatedEvent, InvoiceOrderAddedEvent } from "./InvoiceChangeEvents"
import { IGood } from "../app/externalEvents/externalEventHandler"

export const goodFake = (overrides?: Partial<Product>): IGood => ({
  id: faker.datatype.uuid(),
  name: faker.commerce.productName(),
  price: Number(faker.commerce.price()),
  type: "product",
  ...overrides,
})

export const goodFakes = makeFakes(goodFake)

export const offerWithoutPricingFake = (
  overrides?: Partial<OfferWithoutPricingAndName>,
): OfferWithoutPricingAndName => ({
  goodOffered: { id: faker.datatype.uuid() },
  typeOfGood: "product",
  quantity: faker.datatype.number(),
  businessFunction: "sell",
  ...overrides,
})

export const offerWithoutPricingFakes = makeFakes(offerWithoutPricingFake)

export const offerFake = (overrides?: Partial<InvoiceOffer>): InvoiceOffer => ({
  typeOfGood: "product",
  quantity: faker.datatype.number(),
  businessFunction: "sell",
  goodOffered: goodFake(overrides?.goodOffered),
  price: faker.datatype.number(),
  ...overrides,
})

export const offerFakes = makeFakes(offerFake)

export const orderWithoutPricingFake = (overrides?: Partial<OrderWithoutPricing>): OrderWithoutPricing => ({
  type: "procedure",
  aggregateId: faker.datatype.uuid(),
  name: faker.name.firstName(),
  offers: offerFakes(3),
  ...overrides,
})

export const orderWithoutPricingFakes = makeFakes(orderWithoutPricingFake)

export const orderFake = (overrides?: Partial<InvoiceOrder>): InvoiceOrder => ({
  ...orderWithoutPricingFake(overrides),
  offers: offerFakes(3),
  ...overrides,
})

export const orderFakes = makeFakes(orderFake)

export const invoiceFake = (overrides?: Partial<InvoiceType>): InvoiceType => ({
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
  data: { id: faker.datatype.uuid() },
  ...overrides,
})

export const invoiceEventFakes = (id: string, status: "Billed" = "Billed") => {
  const invoice = invoiceFake({ id })
  return [
    invoiceCreatedEventFake({ aggregateId: invoice.id, data: invoice }),
    orderAddedEventFake({ aggregateId: invoice.id }),
    invoiceBilledEventFake({ aggregateId: invoice.id, data: { id: invoice.id } }),
  ]
}
