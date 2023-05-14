import { throwIfEmpty } from "../../../packages/utils"
import { ConsumedGood, ProcedureStatus, TProcedure } from "./procedure"
import { append, curry, lensPath, lensProp, over } from "ramda"

export class ProcedureApplier {
  constructor() {}

  make(id: string, animalId: string, name: string, status: ProcedureStatus, consumedGoods: ConsumedGood[]): TProcedure {
    throwIfEmpty(id, "Procedure must have an id")
    throwIfEmpty(animalId, "Procedure must have an animalId")
    throwIfEmpty(name, "Procedure must have a name")
    throwIfEmpty(status, "Procedure must have a status")

    return {
      id,
      animalId,
      name,
      status,
      consumedGoods,
    }
  }

  create(animalId: string, name: string, id: string) {
    return this.make(id, animalId, name, "pending", [])
  }

  begin(procedure: TProcedure) {
    return this.make(procedure.id, procedure.animalId, procedure.name, "inProgress", procedure.consumedGoods)
  }

  finish(procedure: TProcedure) {
    return this.make(procedure.id, procedure.animalId, procedure.name, "finished", procedure.consumedGoods)
  }

  consumeGood(procedure: TProcedure, consumedGood: ConsumedGood) {
    const updated = this.addGood(procedure, consumedGood)
    return this.make(updated.id, updated.animalId, updated.name, updated.status, updated.consumedGoods)
  }

  addGood(state: TProcedure, consumedGood: ConsumedGood) {
    const foundIndex = state.consumedGoods.findIndex((contained) => contained.goodId === consumedGood.goodId)

    // item does not already exist
    if (foundIndex === -1) {
      return over(lensProp("consumedGoods"), append(consumedGood), state)
    }

    return over(lensPath(["consumedGoods", foundIndex]), curry(addQuantityToExistingItem)(consumedGood), state)
  }
}

function addQuantityToExistingItem(consumedGood: ConsumedGood, matching: ConsumedGood): ConsumedGood {
  return {
    ...matching,
    quantity: matching.quantity + consumedGood.quantity,
  }
}
