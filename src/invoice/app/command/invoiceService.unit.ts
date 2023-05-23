import {
  invoiceBilledEventFake,
  invoiceCreatedEventFake,
  invoiceFake,
  orderAddedEventFake,
  orderWithoutPricingFake,
} from "../../domain/Invoice.fake"
import { Thespian } from "thespian"
import { Invoice } from "../../domain/Invoice"
import { InvoiceService } from "./invoiceService"
import { assertThat } from "mismatched"

let thespian: Thespian
const setUp = () => {
  thespian = new Thespian()
  const invoice = thespian.mock<Invoice>("Invoice")
  const invoiceService = new InvoiceService(invoice.object)

  return { invoiceService, invoice }
}

afterEach(() => thespian.verify())

describe("InvoiceService", () => {
  describe("create", () => {
    it("should create invoice and return its ID", async () => {
      const { invoiceService, invoice } = setUp()
      const fakeInvoice = invoiceFake()
      const fakeEvent = invoiceCreatedEventFake()

      invoice.setup((i) => i.create(fakeInvoice.customerId)).returns(() => fakeEvent)
      invoice.setup((i) => i.persist([fakeEvent], 0))

      const id = await invoiceService.create(fakeInvoice.customerId)

      assertThat(id).is(fakeEvent.aggregateId)
    })
  })
  describe("addOrder", () => {
    it("should add order to the invoice", async () => {
      const { invoiceService, invoice } = setUp()
      const fakeInvoice = invoiceFake()
      const fakeOrder = orderWithoutPricingFake()
      const fakeEvent = orderAddedEventFake()

      invoice.setup((i) => i.hydrate(fakeInvoice.id)).returns(() => Promise.resolve(fakeInvoice))
      invoice.setup((i) => i.addOrder(fakeInvoice, fakeOrder)).returns(() => Promise.resolve(fakeEvent))
      invoice.setup((i) => i.persist([fakeEvent], 0))

      await invoiceService.addOrder(fakeInvoice.id, fakeOrder, 0)
    })
  })
  describe("bill", () => {
    it("should bill the invoice", async () => {
      const { invoiceService, invoice } = setUp()
      const fakeInvoice = invoiceFake()
      const fakeEvent = invoiceBilledEventFake()

      invoice.setup((i) => i.hydrate(fakeInvoice.id)).returns(() => Promise.resolve(fakeInvoice))
      invoice.setup((i) => i.bill(fakeInvoice)).returns(() => fakeEvent)
      invoice.setup((i) => i.persist([fakeEvent], 0))

      await invoiceService.bill(fakeInvoice.id, 0)
    })
  })
})
