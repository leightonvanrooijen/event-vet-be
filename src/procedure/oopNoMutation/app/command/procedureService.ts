import { Procedure } from "../../domain/procedure"

// Todo add retry logic for optimistic concurrency
export class ProcedureService {
  constructor(private readonly procedure: Procedure) {}

  async create(animalId: string, name: string) {
    const { event } = this.procedure.create(animalId, name)
    await this.procedure.persist([event], 0)
    return event
  }

  async begin(id: string, expectedVersion: number) {
    const state = await this.procedure.hydrate(id)
    const { event } = this.procedure.begin(state)
    return this.procedure.persist([event], expectedVersion)
  }

  async finish(id: string, expectedVersion: number) {
    const state = await this.procedure.hydrate(id)
    const { event } = this.procedure.finish(state)
    return this.procedure.persist([event], expectedVersion)
  }

  async consumeGood(id: string, goodId: string, quantity: number, expectedVersion: number) {
    // Would typically check if the product exists

    const state = await this.procedure.hydrate(id)
    const { event } = this.procedure.consumeGood(state, { goodId, quantity })
    return this.procedure.persist([event], expectedVersion)
  }
}
