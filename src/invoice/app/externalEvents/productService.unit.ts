import { Thespian } from "thespian"
import { Server } from "socket.io"
import { fakeIProductCreatedEvent } from "./externalEvent.fake"
import { ProductService } from "./productService"
import { GoodRepo } from "../../infra/goodRepo"

let thespian: Thespian
const setUp = () => {
  const event = fakeIProductCreatedEvent()

  thespian = new Thespian()

  const goodRepo = thespian.mock<GoodRepo>()
  const socket = thespian.mock<Server>()

  const productService = new ProductService(socket.object, goodRepo.object)

  return { productService, goodRepo, socket, event }
}
afterEach(() => thespian.verify())

describe("inEventHandler", () => {
  describe("productCreated event is received", () => {
    it("creates a good when a productCreated event is received", async () => {
      const { productService, goodRepo, socket, event } = setUp()

      goodRepo.setup((repo) => repo.get(event.aggregateId)).returns(() => Promise.resolve(undefined))
      goodRepo.setup((repo) =>
        repo.create({
          id: event.aggregateId,
          name: event.data.name,
          price: event.data.price,
          type: "product",
        }),
      )

      socket.setup((s) =>
        s.emit("invoiceGoodCreated", {
          id: event.data.id,
          name: event.data.name,
          price: event.data.price,
          type: "product",
        }),
      )

      await productService.handle(event)
    })
    it("does nothing if the good already exists", async () => {
      // test will fail if good gets created
      const { goodRepo, event, productService } = setUp()

      goodRepo
        .setup((repo) => repo.get(event.aggregateId))
        .returns(() =>
          Promise.resolve({
            id: event.aggregateId,
            name: event.data.name,
            price: event.data.price,
            type: "product",
          }),
        )

      await productService.handle(event)
    })
  })
})
