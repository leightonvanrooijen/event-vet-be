import { faker } from "@faker-js/faker"
import { ConsumedGood, TProcedure } from "./procedure"
import {
  GoodConsumedEvent,
  ProcedureBeganEvent,
  ProcedureCreatedEvent,
  ProcedureFinishedEvent,
} from "./procedure.changeEvents"
import { makeFakes } from "../../../packages/eventSourcing/changeEvent.fake"

export const consumedGoodFake = (overwrites?: Partial<ConsumedGood>): ConsumedGood => ({
  goodId: faker.datatype.uuid(),
  quantity: faker.datatype.number(),
  ...overwrites,
})

export const consumedGoodFakes = makeFakes(consumedGoodFake)

export const procedureFake = (overwrites?: Partial<TProcedure>): TProcedure => ({
  id: faker.datatype.uuid(),
  name: faker.name.firstName(),
  animalId: faker.datatype.uuid(),
  status: faker.helpers.arrayElement(["pending", "inProgress", "finished"]) as TProcedure["status"],
  consumedGoods: consumedGoodFakes(2),
  ...overwrites,
})

export const procedureCreatedEventFake = (overwrites?: Partial<ProcedureCreatedEvent>): ProcedureCreatedEvent => {
  const id = overwrites?.data?.id || faker.datatype.uuid()

  return {
    type: "procedureCreated",
    aggregateId: id,
    data: procedureFake({ id, status: "pending" }),
    ...overwrites,
  }
}

export const procedureBeganEventFake = (overwrites?: Partial<ProcedureBeganEvent>): ProcedureBeganEvent => {
  return {
    type: "procedureBegan",
    aggregateId: faker.datatype.uuid(),
    data: { status: "inProgress" },
    ...overwrites,
  }
}

export const procedureFinishedEventFake = (overwrites?: Partial<ProcedureFinishedEvent>): ProcedureFinishedEvent => {
  return {
    type: "procedureFinished",
    aggregateId: faker.datatype.uuid(),
    data: { status: "finished" },
    ...overwrites,
  }
}

export const goodConsumedEventFake = (overwrites?: Partial<GoodConsumedEvent>): GoodConsumedEvent => {
  return {
    type: "goodConsumed",
    aggregateId: faker.datatype.uuid(),
    data: consumedGoodFake(),
    ...overwrites,
  }
}
