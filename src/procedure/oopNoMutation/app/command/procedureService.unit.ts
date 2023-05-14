import { ProcedureService } from "./procedureService"
import { Procedure } from "../../domain/procedure"
import { Thespian } from "thespian"
import {
  consumedGoodFake,
  goodConsumedEventFake,
  procedureBeganEventFake,
  procedureCreatedEventFake,
  procedureFake,
  procedureFinishedEventFake,
} from "../../domain/procedure.fake"

let thespian: Thespian
const setUp = () => {
  thespian = new Thespian()
  const procedure = thespian.mock<Procedure>()
  const service = new ProcedureService(procedure.object)

  return { procedure, service }
}

afterEach(() => thespian.verify())

describe("ProcedureServiceNoMutation", () => {
  describe("create", () => {
    it("can create a procedure", async () => {
      const { procedure, service } = setUp()
      const createReturn = { procedure: procedureFake(), event: procedureCreatedEventFake() }

      procedure.setup((p) => p.create("123", "name")).returns(() => createReturn)
      procedure.setup((p) => p.persist([createReturn.event], 0))

      await service.create("123", "name")
    })
  })
  describe("begin", () => {
    it("begins a procedure", async () => {
      const { procedure, service } = setUp()
      const fakeProcedure = procedureFake({ status: "pending" })
      const beginReturn = { procedure: procedureFake({ status: "inProgress" }), event: procedureBeganEventFake() }

      procedure.setup((p) => p.hydrate(fakeProcedure.id)).returns(() => Promise.resolve(fakeProcedure))
      procedure.setup((p) => p.begin(fakeProcedure)).returns(() => beginReturn)
      procedure.setup((p) => p.persist([beginReturn.event], 0))

      await service.begin(fakeProcedure.id, 0)
    })
  })
  describe("finish", () => {
    it("finishes a procedure", async () => {
      const { procedure, service } = setUp()
      const fakeProcedure = procedureFake({ status: "inProgress" })
      const finishReturn = { procedure: procedureFake({ status: "finished" }), event: procedureFinishedEventFake() }

      procedure.setup((p) => p.hydrate(fakeProcedure.id)).returns(() => Promise.resolve(fakeProcedure))
      procedure.setup((p) => p.finish(fakeProcedure)).returns(() => finishReturn)
      procedure.setup((p) => p.persist([finishReturn.event], 0))

      await service.finish(fakeProcedure.id, 0)
    })
  })
  describe("consumeGood", () => {
    it("consumes a good", async () => {
      const { procedure, service } = setUp()
      const fakeProcedure = procedureFake({ status: "inProgress" })
      const fakeConsumedGood = consumedGoodFake()
      const consumeGoodReturn = {
        procedure: procedureFake({ status: "inProgress" }),
        event: goodConsumedEventFake(),
      }

      procedure.setup((p) => p.hydrate(fakeProcedure.id)).returns(() => Promise.resolve(fakeProcedure))
      procedure.setup((p) => p.consumeGood(fakeProcedure, fakeConsumedGood)).returns(() => consumeGoodReturn)
      procedure.setup((p) => p.persist([consumeGoodReturn.event], 0))

      await service.consumeGood(fakeProcedure.id, fakeConsumedGood.goodId, fakeConsumedGood.quantity, 0)
    })
  })
})
