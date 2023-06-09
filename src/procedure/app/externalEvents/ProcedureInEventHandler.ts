import { Server } from "socket.io"
import { ChangeEvent } from "../../../packages/eventSourcing/changeEvent.types"
import { DataStore } from "../../../packages/db/testDB"
import { VersionedChangeEvent } from "../../../packages/eventSourcing/testEventDb"

export type Product = {
  id: string
  name: string
  price: number
}

export type Good = {
  id: string
  name: string
  type: "product"
}

export type ProductCreatedEvent = VersionedChangeEvent<Product>
export type ExternalEvents = ChangeEvent<any>

export const isProductCreatedEvent = (event: ExternalEvents): event is ProductCreatedEvent =>
  event.type === "productCreated"

export class ProcedureInEventHandler {
  constructor(private readonly socket: Server, private readonly goodRepo: DataStore<Good>) {}

  async handle(events: ExternalEvents[]) {
    for await (const event of events) {
      if (isProductCreatedEvent(event)) {
        await this.handleProductCreated(event)
      }
    }
  }

  async handleProductCreated(event: ProductCreatedEvent) {
    const existingGood = await this.goodRepo.get(event.data.id)
    if (existingGood) return // already handled event

    const good: Good = {
      id: event.data.id,
      name: event.data.name,
      type: "product",
    }
    await this.goodRepo.create(good)
    this.socket.emit("procedureGoodCreated", good)
  }
}
