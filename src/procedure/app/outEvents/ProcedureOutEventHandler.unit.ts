import { ProcedureOutEventHandler } from "./ProcedureOutEventHandler"
import { Thespian } from "thespian"
import { Procedure } from "../../domain/procedure"
import { EventBus } from "../../../packages/eventSourcing/eventBus"
import { procedureFake, procedureFinishedEventFake } from "../../domain/procedure.fake"
import { applyVersion } from "../../../packages/eventSourcing/applyVersion"

describe("POutEventHandler", () => {
  describe("handle", () => {
    it("should handle procedureFinished event", async () => {
      const thespian = new Thespian()
      const procedure = thespian.mock<Procedure>()
      const externalEventBus = thespian.mock<EventBus>()
      const eventHandler = new ProcedureOutEventHandler(procedure.object, externalEventBus.object)

      const fakeProcedure = procedureFake()
      const fakeInternalProcedureFinishedEvent = applyVersion(
        procedureFinishedEventFake({ aggregateId: fakeProcedure.id }),
      )

      procedure.setup((p) => p.hydrate(fakeProcedure.id)).returns(async () => Promise.resolve(fakeProcedure))
      externalEventBus
        .setup((b) =>
          b.process([
            {
              type: "procedureFinished",
              aggregateId: fakeProcedure.id,
              data: fakeProcedure,
              version: fakeInternalProcedureFinishedEvent.version,
            },
          ]),
        )
        .returns(async () => Promise.resolve())

      await eventHandler.handle([fakeInternalProcedureFinishedEvent])

      thespian.verify()
    })
  })
})
