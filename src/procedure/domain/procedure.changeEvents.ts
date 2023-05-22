import { ChangeEvent } from "../../packages/eventSourcing/changeEvent.types"
import { BrokerEvent } from "../../packages/eventSourcing/eventBroker.types"

export type ProcedureCreatedEvent = ChangeEvent<{ id: string; name: string; animalId: string; status: string }>
export type ProcedureBeganEvent = ChangeEvent<{ status: "inProgress" }>
export type ProcedureFinishedEvent = ChangeEvent<{ status: "finished" }>
export type GoodConsumedEvent = ChangeEvent<{ goodId: string; quantity: number }>
export type ProcedureEvents = ProcedureCreatedEvent | ProcedureBeganEvent | ProcedureFinishedEvent | GoodConsumedEvent

export class ProcedureChangeEvents {
  constructor() {}
  created(id: string, name: string, animalId: string, status: string): ProcedureCreatedEvent {
    return { type: "procedureCreated", aggregateId: id, data: { id, name, animalId, status } }
  }

  began(id: string): ProcedureBeganEvent {
    return {
      type: "procedureBegan",
      aggregateId: id,
      data: { status: "inProgress" },
    }
  }

  finished(id: string): ProcedureFinishedEvent {
    return {
      type: "procedureFinished",
      aggregateId: id,
      data: { status: "finished" },
    }
  }

  goodConsumed(id: string, goodId: string, quantity: number): GoodConsumedEvent {
    return {
      type: "goodConsumed",
      aggregateId: id,
      data: { goodId, quantity },
    }
  }

  isBegan(event: BrokerEvent): event is ProcedureBeganEvent {
    return event.type === "procedureBegan"
  }

  isCreated(event: BrokerEvent): event is ProcedureCreatedEvent {
    return event.type === "procedureCreated"
  }

  isFinished(event: BrokerEvent): event is ProcedureFinishedEvent {
    return event.type === "procedureFinished"
  }

  isGoodConsumed(event: BrokerEvent): event is GoodConsumedEvent {
    return event.type === "goodConsumed"
  }
}
