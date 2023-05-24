import { BrokerEvent } from "../../../packages/eventSourcing/eventBroker.types"
import { DataStore } from "../../../packages/db/testDB"
import { ProcedureStatus, TProcedure } from "../../domain/procedure"
import {
  GoodConsumedEvent,
  ProcedureBeganEvent,
  ProcedureCreatedEvent,
  ProcedureFinishedEvent,
} from "../../domain/procedure.changeEvents"
import { SocketIoNotifier } from "./socketIoNotifier"
import { Handler } from "../../../packages/eventSourcing/eventBus"
import { Versioned } from "../../../packages/eventSourcing/applyVersion"
// Todo this is quite brittle in terms of event ordering and blind application of events

export class WriteEvents {
  isBegan(event: BrokerEvent): event is Versioned<ProcedureBeganEvent> {
    return event.type === "procedureBegan"
  }

  isCreated(event: BrokerEvent): event is Versioned<ProcedureCreatedEvent> {
    return event.type === "procedureCreated"
  }

  isFinished(event: BrokerEvent): event is Versioned<ProcedureFinishedEvent> {
    return event.type === "procedureFinished"
  }

  isGoodConsumed(event: BrokerEvent): event is Versioned<GoodConsumedEvent> {
    return event.type === "goodConsumed"
  }
}

export class WriteHandler implements Handler {
  constructor(
    private readonly event: WriteEvents,
    private readonly db: DataStore<Versioned<TProcedure>>, // borrowed from command side
    private readonly notifier: SocketIoNotifier,
  ) {}

  async handle(events: BrokerEvent[]) {
    for await (const event of events) {
      if (this.event.isCreated(event)) await this.applyCreate(event)
      if (this.event.isBegan(event)) await this.applyBegin(event)
      if (this.event.isFinished(event)) await this.applyFinish(event)
      if (this.event.isGoodConsumed(event)) await this.applyGoodConsumed(event)
    }
  }

  async applyCreate(event: Versioned<ProcedureCreatedEvent>) {
    const procedure = {
      id: event.aggregateId,
      name: event.data.name,
      animalId: event.data.animalId,
      status: event.data.status as ProcedureStatus,
      consumedGoods: [],
      version: event.version,
    }
    await this.db.create(procedure)
    await this.notifier.notify(event.aggregateId)
  }

  async applyBegin(event: Versioned<ProcedureBeganEvent>) {
    await this.db.update({ id: event.aggregateId, status: event.data.status, version: event.version })
    await this.notifier.notify(event.aggregateId)
  }

  async applyFinish(event: Versioned<ProcedureFinishedEvent>) {
    await this.db.update({ id: event.aggregateId, status: event.data.status, version: event.version })
    await this.notifier.notify(event.aggregateId)
  }

  async applyGoodConsumed(event: Versioned<GoodConsumedEvent>) {
    const procedure = await this.db.get(event.aggregateId)
    if (!procedure) throw new Error("Procedure not found")

    const consumedGoods = procedure.consumedGoods
    const goodIndex = consumedGoods.findIndex((good) => good.goodId === event.data.goodId)
    if (goodIndex === -1) {
      consumedGoods.push({ goodId: event.data.goodId, quantity: event.data.quantity })
    } else {
      consumedGoods[goodIndex].quantity = Number(consumedGoods[goodIndex].quantity) + Number(event.data.quantity)
    }

    await this.db.update({ id: event.aggregateId, consumedGoods, version: event.version })
    await this.notifier.notify(event.aggregateId)
  }
}
