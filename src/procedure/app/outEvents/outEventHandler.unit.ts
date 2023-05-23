import { OutEventHandler } from "./outEventHandler"
import { goodConsumedEventFake } from "../../domain/procedure.fake"

describe("OutEventHandler", () => {
  describe("handle", () => {
    it("calls each handler with the events", async () => {
      const handler1 = { handle: jest.fn() }
      const outHandler = new OutEventHandler()

      const events = goodConsumedEventFake()
      outHandler.register(handler1)

      await outHandler.handle([events])

      expect(handler1.handle).toHaveBeenCalledWith([events])
    })
  })
})
