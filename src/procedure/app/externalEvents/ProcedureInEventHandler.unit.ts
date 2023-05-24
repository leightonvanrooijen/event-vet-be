import { ProcedureInEventHandler, Good } from "./ProcedureInEventHandler"
import { Thespian } from "thespian"
import { Server } from "socket.io"
import { DataStore } from "../../../packages/db/testDB"
import { fakeProductCreatedEvent } from "./procedureInEvent.fake"

let thespian: Thespian
const setUp = () => {
  const event = fakeProductCreatedEvent()

  thespian = new Thespian()

  const goodRepo = thespian.mock<DataStore<Good>>()
  const socket = thespian.mock<Server>()

  const externalEventHandler = new ProcedureInEventHandler(socket.object, goodRepo.object)

  return { externalEventHandler, goodRepo, socket, event }
}
afterEach(() => thespian.verify())

describe("externalEventHandler", () => {
  describe("productCreated event is received", () => {
    it("creates a good when a productCreated event is received", async () => {
      const { goodRepo, socket, event, externalEventHandler } = setUp()

      goodRepo.setup((repo) => repo.get(event.aggregateId)).returns(() => Promise.resolve(undefined))
      goodRepo.setup((repo) =>
        repo.create({
          id: event.aggregateId,
          name: event.data.name,
          type: "product",
        }),
      )

      socket.setup((s) => s.emit("procedureGoodCreated", { id: event.data.id, name: event.data.name, type: "product" }))

      await externalEventHandler.handle([event])
    })
    it("does nothing if the good already exists", async () => {
      // test will fail if good gets created
      const { goodRepo, event, externalEventHandler } = setUp()

      goodRepo
        .setup((repo) => repo.get(event.aggregateId))
        .returns(() =>
          Promise.resolve({
            id: event.aggregateId,
            name: event.data.name,
            type: "product",
          }),
        )

      await externalEventHandler.handle([event])
    })
  })
})
