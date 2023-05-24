import { Server } from "socket.io"
import { EventHandler, IExternalEvents } from "./InEventHandler"
import { GoodRepo } from "../../infra/goodRepo"
import { ChangeEvent } from "../../../packages/eventSourcing/changeEvent.types"

export type IProduct = {
  id: string
  name: string
  price: number
}

export type IGood = {
  id: string
  name: string
  price: number
  type: "product"
}

export type IProductCreatedEvent = ChangeEvent<IProduct>

export class IProductService implements EventHandler {
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
