import {
  invoiceBilledEventFake,
  invoiceCreatedEventFake,
  invoiceFake,
  orderAddedEventFake,
  orderFake,
} from "../../domain/Invoice.fake"
import { InvoiceWriteEvents, InvoiceWriteHandler } from "./InvoiceWriteHandler"
import { Thespian } from "thespian"
import { DataStore } from "../../../packages/db/testDB"
import { applyVersion, Versioned } from "../../../packages/eventSourcing/applyVersion"
import { InvoiceT } from "../../domain/Invoice"

let thespian: Thespian
const setUp = () => {
  thespian = new Thespian()
  const mockDb = thespian.mock<DataStore<Versioned<InvoiceT>>>()

  const writeHandler = new InvoiceWriteHandler(new InvoiceWriteEvents(), mockDb.object)

  return { writeHandler, mockDb }
}

afterEach(() => thespian.verify())

describe("writeHandler", () => {
  describe("handle", () => {
    it("should create an invoice if the create event is received", async () => {
      const { writeHandler, mockDb } = setUp()
      const fake = applyVersion(invoiceFake())
      const invoiceCreatedEvent = applyVersion(invoiceCreatedEventFake({ data: fake }))

      mockDb.setup((s) => s.create(fake))

      await writeHandler.handle([invoiceCreatedEvent])
    })
    it("should add the order to the invoice if an order added event is received", async () => {
      const { writeHandler, mockDb } = setUp()
      const fakeOrder = orderFake()
      const fakeInvoice = applyVersion(invoiceFake({ orders: [] }))
      const orderAddedEvent = applyVersion(
        orderAddedEventFake({ aggregateId: fakeInvoice.id, data: { order: fakeOrder } }),
      )

      mockDb.setup((s) => s.get(fakeInvoice.id)).returns(() => Promise.resolve(fakeInvoice))
      mockDb.setup((s) => s.update({ ...fakeInvoice, version: orderAddedEvent.version, orders: [fakeOrder] }))

      await writeHandler.handle([orderAddedEvent])
    })
    it("should bill the invoice if an invoice billed event is received", async () => {
      const { writeHandler, mockDb } = setUp()
      const fakeInvoice = applyVersion(invoiceFake({ orders: [] }))
      const invoiceBilledEvent = applyVersion(invoiceBilledEventFake({ aggregateId: fakeInvoice.id }))

      mockDb.setup((s) => s.get(fakeInvoice.id)).returns(() => Promise.resolve(fakeInvoice))
      mockDb.setup((s) => s.update({ ...fakeInvoice, version: invoiceBilledEvent.version, status: "billed" }))

      await writeHandler.handle([invoiceBilledEvent])
    })
  })
})
