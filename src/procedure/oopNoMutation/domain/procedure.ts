import { createUuid, Uuid } from "../../../packages/uuid/uuid.types"
import { ProcedureRepo } from "../infra/procedureRepo"
import { ProcedureHydrator } from "./procedure.hydrator"
import { ProcedureChangeEvents, ProcedureCreatedEvent, ProcedureEvents } from "./procedure.changeEvents"
import { ProcedureApplier } from "./procedure.applier"

export type ProcedureStatus = "pending" | "inProgress" | "finished"
export type TProcedure = {
  id: string
  name: string
  animalId: string
  status: ProcedureStatus
  consumedGoods: ConsumedGood[]
}

export type ConsumedGood = {
  quantity: number
  goodId: string
}

export class Procedure {
  constructor(
    private readonly repo: ProcedureRepo,
    private readonly event: ProcedureChangeEvents,
    private readonly applier: ProcedureApplier,
    private readonly hydrator: ProcedureHydrator,
    private uuid: Uuid = createUuid,
  ) {}

  create(animalId: string, name: string, id: string = this.uuid()) {
    const procedure = this.applier.create(animalId, name, id)
    const event: ProcedureCreatedEvent = this.event.created(
      procedure.id,
      procedure.name,
      procedure.animalId,
      procedure.status,
    )

    return { procedure, event }
  }

  begin(state: TProcedure) {
    if (state.status !== "pending") throw new Error("Procedure must be pending to begin")

    const procedure = this.applier.begin(state)
    const event = this.event.began(procedure.id)

    return { procedure, event }
  }

  finish(state: TProcedure) {
    if (state.status !== "inProgress") throw new Error("Procedure must be in progress to finish")

    const procedure = this.applier.finish(state)
    const event = this.event.finished(procedure.id)

    return { procedure, event }
  }

  consumeGood(state: TProcedure, consumedGood: ConsumedGood) {
    if (state.status !== "inProgress") throw new Error("Procedure must be in progress to consume good")

    const procedure = this.applier.consumeGood(state, consumedGood)
    const event = this.event.goodConsumed(procedure.id, consumedGood.goodId, consumedGood.quantity)
    return { procedure, event }
  }

  async persist(events: ProcedureEvents[], expectedVersion: number) {
    return this.repo.save(events, expectedVersion)
  }

  async hydrate(id: string) {
    const events = await this.repo.get(id)
    return this.hydrator.hydrate(events)
  }
}
