import { OutEventHandler42 } from "./outEventHandler42"
import { goodConsumedEventFake } from "../../domain/procedure.fake"

describe("OutEventHandler", () => {
  describe("handle", () => {
    it("calls each handler with the events", async () => {
      const handler1 = { handle: jest.fn() }
      const outHandler = new OutEventHandler42()

      const events = goodConsumedEventFake()
      outHandler.register(handler1)

      await outHandler.handle([events])

      expect(handler1.handle).toHaveBeenCalledWith([events])
    })
  })
})
