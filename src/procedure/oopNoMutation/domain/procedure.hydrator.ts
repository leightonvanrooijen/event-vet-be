import { TProcedure } from "./procedure"
import { ProcedureApplier } from "./procedure.applier"
import { ProcedureChangeEvents } from "./procedure.changeEvents"
import { BrokerEvent } from "../../../packages/eventSourcing/eventBroker.types"

export class ProcedureHydrator {
  constructor(private readonly event: ProcedureChangeEvents, private readonly applier: ProcedureApplier) {}

  hydrate(events: BrokerEvent[]) {
    return events.reduce((procedure: TProcedure, event) => {
      if (this.event.isCreated(event)) {
        return this.applier.create(event.data.animalId, event.data.name, event.aggregateId)
      }
      if (this.event.isBegan(event)) {
        return this.applier.begin(procedure)
      }
      if (this.event.isFinished(event)) {
        return this.applier.finish(procedure)
      }
      if (this.event.isGoodConsumed(event)) {
        return this.applier.consumeGood(procedure, { goodId: event.data.goodId, quantity: event.data.quantity })
      }
    }, {} as TProcedure)
  }
}
