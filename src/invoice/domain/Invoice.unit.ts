import { Thespian } from "thespian"
import { Invoice } from "./Invoice"
import { assertThat, match } from "mismatched"
import { goodFake, invoiceEventFakes, invoiceFake, offerFake, orderFake } from "./Invoice.fake"
import { InvoiceChangeEvents } from "./InvoiceChangeEvents"
import { InvoiceRepo } from "../infra/InvoiceRepo"
import { InvoiceHydrator } from "./InvoiceHydrator"
import { InvoiceApplier } from "./InvoiceApplier"
import { GoodRepo } from "../infra/goodRepo"

let thespian: Thespian
const setUp = () => {
  thespian = new Thespian()
  const repo = thespian.mock<InvoiceRepo>("InvoiceRepo")
  const event = new InvoiceChangeEvents()
  const applier = new InvoiceApplier()
  const hydrator = new InvoiceHydrator(event, applier)
  const goodRepo = thespian.mock<GoodRepo>("GoodRepo")

  const invoice = new Invoice(repo.object, event, applier, hydrator, goodRepo.object, () => "123")

  return { invoice, repo, goodRepo }
}

afterEach(() => thespian.verify())
describe("Invoice", () => {
  describe("create", () => {
    it("can create an invoice", async () => {
      const { invoice } = setUp()
      const fakeInvoice = invoiceFake({ status: "draft" })

      const event = invoice.create(fakeInvoice.customerId)

      assertThat(event).is(
        match.obj.has({
          type: "invoiceCreated",
          data: { id: "123", customerId: fakeInvoice.customerId, status: "draft", orders: [] },
        }),
      )
    })
    it("must have a valid customerId", () => {
      const { invoice } = setUp()

      expect(() => invoice.create("")).toThrow("An Invoice must contain an customerId")
    })
    it("if there is no orders it will create an empty array", () => {
      const { invoice } = setUp()
      const fakeInvoice = invoiceFake({ orders: undefined })

      const event = invoice.create(fakeInvoice.customerId)

      expect(event.data.orders).toEqual([])
    })
  })
  describe("addOrder", () => {
    it("can add an order to an invoice, also adds pricing to each good", async () => {
      // TODO break this out into easier to aggregates

      const { invoice, goodRepo } = setUp()
      const fakeInvoice = invoiceFake({ status: "draft", orders: [] })
      const fakeGood = goodFake({ price: 100 })
      const fakeOffer = offerFake({ goodOffered: fakeGood, quantity: 2 })
      const fakeOrder = orderFake({ offers: [fakeOffer] })

      goodRepo.setup((g) => g.getByIds([fakeOffer.goodOffered.id])).returns(() => Promise.resolve([fakeGood]))

      const event = await invoice.addOrder(fakeInvoice, fakeOrder)

      assertThat(event).is(
        match.obj.has({
          type: "orderAdded",
          data: {
            order: {
              type: "procedure",
              aggregateId: fakeOrder.aggregateId,
              name: fakeOrder.name,
              offers: [
                {
                  goodOffered: fakeOffer.goodOffered,
                  typeOfGood: fakeOffer.typeOfGood,
                  quantity: fakeOffer.quantity,
                  price: 200,
                  businessFunction: fakeOffer.businessFunction,
                },
              ],
            },
          },
        }),
      )
    })
    it("billed invoices cannot have orders added", async () => {
      const { invoice } = setUp()
      const fakeInvoice = invoiceFake({ status: "billed" })

      await expect(() => invoice.addOrder(fakeInvoice, orderFake())).rejects.toThrow(
        "Cannot add order to billed invoice",
      )
    })
    it("cannot add an order that already exists", async () => {
      const { invoice } = setUp()
      const fakeInvoice = invoiceFake({ status: "draft", orders: [orderFake()] })

      await expect(async () => invoice.addOrder(fakeInvoice, fakeInvoice.orders[0])).rejects.toThrow(
        "Order is already on the invoice",
      )
    })
  })
  describe("bill", () => {
    it("can bill an invoice", async () => {
      const { invoice } = setUp()
      const fakeInvoice = invoiceFake({ status: "draft" })

      const event = invoice.bill(fakeInvoice)

      assertThat(event).is(match.obj.has({ type: "invoiceBilled", data: { id: fakeInvoice.id } }))
    })
    it("cannot bill an already billed invoice", () => {
      const { invoice } = setUp()
      const fakeInvoice = invoiceFake({ status: "billed" })

      expect(() => invoice.bill(fakeInvoice)).toThrow("Cannot bill an already billed invoice")
    })
  })
  describe("hydrate", () => {
    it("can hydrate an billed invoice", async () => {
      // this tests that everything works together
      const { invoice, repo } = setUp()
      const aggregateId = "123"
      const events = invoiceEventFakes(aggregateId, "Billed")

      repo.setup((r) => r.get(aggregateId)).returns(() => Promise.resolve(events))

      const hydrated = await invoice.hydrate(aggregateId)

      assertThat(hydrated).is(match.obj.has({ id: aggregateId, status: "billed" }))
    })
  })
})
