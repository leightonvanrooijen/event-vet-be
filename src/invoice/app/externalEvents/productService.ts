import { Server } from "socket.io"
import { EventHandler, IExternalEvents, IGood, IProductCreatedEvent } from "./externalEventHandler"
import { GoodRepo } from "../../infra/goodRepo"

export class ProductService implements EventHandler {
  constructor(private readonly socket: Server, private readonly goodRepo: GoodRepo) {}

  async handle(event: IExternalEvents) {
    if (this.isProductCreatedEvent(event)) {
      await this.handleProductCreated(event)
    }
  }

  async handleProductCreated(event: IProductCreatedEvent) {
    const existingGood = await this.goodRepo.get(event.data.id)
    if (existingGood) return // already handled event

    const good: IGood = {
      id: event.data.id,
      name: event.data.name,
      price: event.data.price,
      type: "product",
    }
    await this.goodRepo.create(good)
    this.socket.emit("invoiceGoodCreated", good)
  }

  isProductCreatedEvent(event: IExternalEvents): event is IProductCreatedEvent {
    return event.type === "productCreated"
  }
}
