import { ChangeEvent } from "../../../packages/eventSourcing/changeEvent.types"
import { InvoiceService } from "../command/invoiceService"
import { ConsumedGood, ProcedureStatus } from "../../../procedure/domain/procedure"
import { RequestedOffer, RequestedOrder } from "../command/command.types"

export type IProduct = {
  id: string
  name: string
  price: number
}

export type IProcedure = {
  id: string
  name: string
  animalId: string
  status: ProcedureStatus
  consumedGoods: ConsumedGood[]
}

export type IGood = {
  id: string
  name: string
  price: number
  type: "product"
}

export type IProductCreatedEvent = ChangeEvent<IProduct>
export type IProcedureFinishedEvent = ChangeEvent<IProcedure>
export type IExternalEvents = ChangeEvent<any>

export type EventHandler = {
  handle(event: IExternalEvents): Promise<void>
}

export class ExternalEventHandler {
  private readonly services: EventHandler[] = []
  constructor() {}

  addService(service: EventHandler) {
    this.services.push(service)
  }

  // work out ordering and if I can handle these async or something
  async handle(events: IExternalEvents[]) {
    for await (const event of events) {
      for await (const service of this.services) {
        await service.handle(event)
      }
    }
  }
}

export class ProcedureService implements EventHandler {
  constructor(private readonly invoiceService: InvoiceService) {}

  async handle(event: IExternalEvents) {
    if (this.isProcedureFinishedEvent(event)) {
      await this.handleProcedureFinished(event)
    }
  }
  async handleProcedureFinished(event: IProcedureFinishedEvent) {
    // this requires two calls to the db which is not ideal but enables decoupling
    // would typically attach a customer via the animalId
    const id = await this.invoiceService.create("123")
    const order = this.convertProcedureToOrder(event.data)
    await this.invoiceService.addOrder(id, order, 1)
  }

  convertProcedureToOrder(procedure: IProcedure): RequestedOrder {
    return {
      aggregateId: procedure.id,
      type: "procedure",
      name: procedure.name,
      offers: procedure.consumedGoods.map(this.convertConsumedGoodToOffer),
    }
  }

  convertConsumedGoodToOffer(consumedGood: ConsumedGood): RequestedOffer {
    return {
      goodOffered: {
        id: consumedGood.goodId,
      },
      quantity: consumedGood.quantity,
      typeOfGood: "product",
      businessFunction: "sell",
    }
  }

  isProcedureFinishedEvent(event: IExternalEvents): event is IProcedureFinishedEvent {
    return event.type === "procedureFinished"
  }
}
