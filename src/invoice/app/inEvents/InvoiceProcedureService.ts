import { InvoiceService } from "../command/invoiceService"
import { RequestedOffer, RequestedOrder } from "../command/command.types"
import { EventHandler, IExternalEvents } from "./InvoiceInEventHandler"
import { ChangeEvent } from "../../../packages/eventSourcing/changeEvent.types"
import { ConsumedGood } from "../../../procedure/domain/procedure"

export type IProcedure = {
  id: string
  name: string
  animalId: string
  status: "pending" | "inProgress" | "finished"
  consumedGoods: {
    quantity: number
    goodId: string
  }[]
}

export type IProcedureFinishedEvent = ChangeEvent<IProcedure>
export class InvoiceProcedureService implements EventHandler {
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
      offers: procedure.consumedGoods?.map(this.convertConsumedGoodToOffer),
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
