import { EventBus, Handler } from "../../../packages/eventSourcing/eventBus"
import { BrokerEvent } from "../../../packages/eventSourcing/eventBroker.types"
import { ProcedureFinishedEvent } from "../../domain/procedure.changeEvents"
import { Versioned } from "../../../packages/eventSourcing/applyVersion"
import { Procedure } from "../../domain/procedure"

export class ProcedureOutEventHandler implements Handler {
  constructor(private readonly procedure: Procedure, private readonly externalEventBus: EventBus) {}

  async handle(events: BrokerEvent[]) {
    for await (const event of events) {
      if (this.isProcedureFinishedEvent(event)) await this.handleProcedureFinishedEvent(event)
    }
  }

  async handleProcedureFinishedEvent(event: Versioned<ProcedureFinishedEvent>) {
    const procedure = await this.procedure.hydrate(event.aggregateId)
    const externalEvent = {
      type: "procedureFinished",
      aggregateId: event.aggregateId,
      data: procedure,
      version: event.version,
    }

    await this.externalEventBus.process([externalEvent])
  }

  isProcedureFinishedEvent(event: BrokerEvent): event is Versioned<ProcedureFinishedEvent> {
    return event.type === "procedureFinished"
  }
}
