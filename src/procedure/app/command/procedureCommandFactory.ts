import { EventBus } from "../../../packages/eventSourcing/eventBus"
import { TestEventDb } from "../../../packages/eventSourcing/testEventDb"
import { ProcedureRepo } from "../../infra/procedureRepo"
import { ProcedureChangeEvents } from "../../domain/procedure.changeEvents"
import { ProcedureApplier } from "../../domain/procedure.applier"
import { ProcedureHydrator } from "../../domain/procedure.hydrator"
import { Procedure } from "../../domain/procedure"
import { ProcedureService } from "./procedureService"

export class ProcedureCommandFactory {
  static build(eventBroker: EventBus) {
    const commandDb = new TestEventDb(eventBroker)
    const repo = new ProcedureRepo(commandDb)
    const event = new ProcedureChangeEvents()
    const applier = new ProcedureApplier()
    const hydrator = new ProcedureHydrator(event, applier)

    const procedure = new Procedure(repo, event, applier, hydrator)
    return new ProcedureService(procedure)
  }
}
