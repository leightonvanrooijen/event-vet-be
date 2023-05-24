import { Thespian } from "thespian"
import { InvoiceService } from "../command/invoiceService"
import { InvoiceProcedureService } from "./InvoiceProcedureService"
import { faker } from "@faker-js/faker"
import { match } from "mismatched"

const fakeProcedureFinishedEvent = {
  type: "procedureFinished",
  aggregateId: faker.datatype.uuid(),
  version: 3,
  data: {
    id: faker.datatype.uuid(),
    name: faker.name.jobTitle(),
    animalId: faker.datatype.uuid(),
    status: "finished",
    consumedGoods: [
      {
        quantity: 4,
        goodId: faker.datatype.uuid(),
      },
    ],
  },
}
describe("IProcedureService", () => {
  describe("handle", () => {
    it("should handle procedureFinished event", async () => {
      const thespian = new Thespian()
      const invoiceService = thespian.mock<InvoiceService>("InvoiceService")

      const procedureService = new InvoiceProcedureService(invoiceService.object)

      // TODO customer id is "123" as it is not set up
      // TODO replace match any with expected object
      invoiceService.setup((mock) => mock.create("123")).returns(() => Promise.resolve("123"))
      invoiceService.setup((mock) => mock.addOrder("123", match.any(), 1)).returns(() => Promise.resolve())

      await procedureService.handle(fakeProcedureFinishedEvent)
    })
  })
})
