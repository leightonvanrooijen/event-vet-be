import { EventBus } from "../../../packages/eventSourcing/eventBus"
import { TestEventDb } from "../../../packages/eventSourcing/testEventDb"
import { ProcedureRepo } from "../../infra/procedureRepo"
import { ProcedureChangeEvents } from "../../domain/procedure.changeEvents"
import { ProcedureApplier } from "../../domain/procedure.applier"
import { ProcedureHydrator } from "../../domain/procedure.hydrator"
import { Procedure } from "../../domain/procedure"
import { ProcedureService } from "./procedureService"
import { ProcedureOutEventHandler } from "../outEvents/ProcedureOutEventHandler"
import { ProcedureCommandApi } from "./command.api"
import { Application } from "express"

export class ProcedureCommandFactory {
  static build(app: Application, internalEventBus: EventBus, externalEventBus: EventBus) {
    const commandDb = new TestEventDb(internalEventBus)
    const repo = new ProcedureRepo(commandDb)
    const event = new ProcedureChangeEvents()
    const applier = new ProcedureApplier()
    const hydrator = new ProcedureHydrator(event, applier)

    const procedure = new Procedure(repo, event, applier, hydrator)

    // Register out events to fire when certain internal events happen
    const outEventHandler = new ProcedureOutEventHandler(procedure, externalEventBus)
    internalEventBus.registerHandler(outEventHandler)

    const procedureService = new ProcedureService(procedure)
    new ProcedureCommandApi(app, procedureService).setUp()
  }
}
