import { ProductCreatedEvent } from "./ProcedureInEventHandler"
import { faker } from "@faker-js/faker"
import { makeFakes } from "../../../packages/eventSourcing/changeEvent.fake"

export const fakeProductCreatedEvent = (overrides?: Partial<ProductCreatedEvent>): ProductCreatedEvent => {
  const id = overrides?.data?.id || faker.datatype.uuid()
  return {
    type: "productCreated",
    aggregateId: id,
    data: {
      id,
      name: faker.commerce.productName(),
      price: Number(faker.commerce.price()),
    },
    version: 1,
    ...overrides,
  }
}

export const fakeProductCreatedEvents = makeFakes(fakeProductCreatedEvent)
