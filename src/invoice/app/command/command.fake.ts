import { RequestedOffer, RequestedOrder } from "./command.types"
import { faker } from "@faker-js/faker"
import { offerFakes } from "../../domain/Invoice.fake"

export const requestedOfferFake = (overrides?: Partial<RequestedOffer>): RequestedOffer => ({
  goodOffered: { id: faker.datatype.uuid() },
  typeOfGood: "product",
  quantity: faker.datatype.number(),
  businessFunction: "sell",
  ...overrides,
})
export const requestedOrderFake = (overrides?: Partial<RequestedOrder>): RequestedOrder => ({
  type: "procedure",
  aggregateId: faker.datatype.uuid(),
  name: faker.name.firstName(),
  offers: offerFakes(3),
  ...overrides,
})
