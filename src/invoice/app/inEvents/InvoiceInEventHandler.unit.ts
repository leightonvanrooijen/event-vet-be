import { InvoiceInEventHandler } from "./InvoiceInEventHandler"
import { fakeIProductCreatedEvent } from "./InvoiceinEvent.fake"

describe("externalEventHandler", () => {
  // I could not get this to work with Thespian - I think it is because of the async nature for loop
  it("calls registered handlers when events are received", async () => {
    const event = fakeIProductCreatedEvent()
    const mockService = {
      handle: jest.fn(),
    }

    const externalEventHandler = new InvoiceInEventHandler()
    externalEventHandler.addService(mockService)
    await externalEventHandler.handle([event])

    expect(mockService.handle).toHaveBeenCalledWith(event)
  })
})
