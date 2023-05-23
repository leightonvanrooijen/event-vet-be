import { EventBroker, Handler } from "./eventBroker"
import { Thespian } from "thespian"

describe("buildEventBroker", () => {
  describe("process", () => {
    it("call each eventHandler with the events", async () => {
      const fakeEvents = [
        { eventId: "123", aggregateId: "123", type: "a", data: {}, version: 1 },
        { eventId: "1233", aggregateId: "123", type: "a", data: {}, version: 2 },
      ]

      const thespian = new Thespian()
      const fakeHandler = thespian.mock<Handler>("handler")
      const fakeHandler2 = thespian.mock<Handler>("handler2")
      const eventConsumer = new EventBroker()

      fakeHandler.setup((s) => s.handle(fakeEvents)).returns(() => Promise.resolve())
      fakeHandler2.setup((s) => s.handle(fakeEvents)).returns(() => Promise.resolve())

      eventConsumer.registerHandler(fakeHandler.object)
      eventConsumer.registerHandler(fakeHandler2.object)
      await eventConsumer.process(fakeEvents)

      thespian.verify()
    })
  })
})
