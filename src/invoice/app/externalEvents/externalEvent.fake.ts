import { IProductCreatedEvent } from "./externalEventHandler"
import { faker } from "@faker-js/faker"
import { makeFakes } from "../../../packages/eventSourcing/changeEvent.fake"

export const fakeIProductCreatedEvent = (overrides?: Partial<IProductCreatedEvent>): IProductCreatedEvent => {
  const id = overrides?.data?.id || faker.datatype.uuid()
  return {
    type: "productCreated",
    aggregateId: id,
    data: {
      id,
      name: faker.commerce.productName(),
      price: Number(faker.commerce.price()),
    },
    ...overrides,
  }
}

export const fakeIProductCreatedEvents = makeFakes(fakeIProductCreatedEvent)
