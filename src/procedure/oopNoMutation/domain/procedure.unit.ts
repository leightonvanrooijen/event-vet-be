import { Thespian } from "thespian"
import { assertThat, match } from "mismatched"
import { consumedGoodFake, procedureCreatedEventFake, procedureFake } from "./procedure.fake"
import { Procedure } from "./procedure"
import { ProcedureRepo } from "../infra/procedureRepo"
import { ProcedureHydrator } from "./procedure.hydrator"
import { ProcedureApplier } from "./procedure.applier"
import { ProcedureChangeEvents } from "./procedure.changeEvents"

let thespian: Thespian
const setUp = () => {
  thespian = new Thespian()
  const repo = thespian.mock<ProcedureRepo>("ProcedureRepo")
  const procedureFn = new Procedure(
    repo.object,
    new ProcedureChangeEvents(),
    new ProcedureApplier(),
    new ProcedureHydrator(new ProcedureChangeEvents(), new ProcedureApplier()),
    () => "123",
  )

  return { procedureFn, repo }
}

afterEach(() => thespian.verify())

describe("Procedure", () => {
  describe("create", () => {
    it("can create a procedure", async () => {
      const { procedureFn } = setUp()
      const fakeProcedure = procedureFake()

      const { procedure, event } = procedureFn.create(fakeProcedure.animalId, fakeProcedure.name)

      assertThat(event).is(match.obj.has({ type: "procedureCreated" }))
      assertThat(procedure).is({
        id: "123",
        status: "pending",
        name: fakeProcedure.name,
        animalId: fakeProcedure.animalId,
        consumedGoods: [],
      })
    })
    it("must have a valid name", () => {
      const { procedureFn } = setUp()

      expect(() => procedureFn.create("123", "")).toThrow("Procedure must have a name")
    })
    it("must have a valid animalId", () => {
      const { procedureFn } = setUp()

      expect(() => procedureFn.create("", "123")).toThrow("Procedure must have an animalId")
    })
  })

  describe("begin", () => {
    it("begins a procedure", async () => {
      const { procedureFn } = setUp()
      const fakeProcedure = procedureFake({ status: "pending" })

      const { procedure, event } = procedureFn.begin(fakeProcedure)

      assertThat(event).is(match.obj.has({ type: "procedureBegan" }))
      assertThat(procedure).is(match.obj.has({ status: "inProgress" }))
    })
  })
  describe("finish", () => {
    it("finishes a procedure", async () => {
      const { procedureFn } = setUp()
      const fakeProcedure = procedureFake({ status: "inProgress" })

      const { procedure, event } = procedureFn.finish(fakeProcedure)

      assertThat(event).is(match.obj.has({ type: "procedureFinished" }))
      assertThat(procedure).is(match.obj.has({ status: "finished" }))
    })
  })

  describe("consumeGood", () => {
    it("adds the good to the consumed goods array if it has NOT been consumed on the procedure before", async () => {
      const { procedureFn } = setUp()
      const fakeProcedure = procedureFake({ status: "inProgress", consumedGoods: [] })
      const fakeGood = { goodId: "123", quantity: 1 }

      const { procedure, event } = procedureFn.consumeGood(fakeProcedure, fakeGood)

      assertThat(event).is(match.obj.has({ type: "goodConsumed" }))
      assertThat(procedure).is(match.obj.has({ consumedGoods: [fakeGood] }))
    })
    it("adds the quantity of the consumed good if it has been consumed on the procedure before", async () => {
      const { procedureFn } = setUp()
      const fakeGood = consumedGoodFake({ quantity: 1 })
      const fakeProcedure = procedureFake({ status: "inProgress", consumedGoods: [fakeGood] })

      const { procedure, event } = procedureFn.consumeGood(fakeProcedure, fakeGood)

      assertThat(event).is(match.obj.has({ type: "goodConsumed" }))
      assertThat(procedure.consumedGoods[0]).is(match.obj.has({ quantity: 2 }))
    })
    it("must be in progress", () => {
      const { procedureFn } = setUp()
      const fakeProcedure = procedureFake({ status: "pending" })

      expect(() => procedureFn.consumeGood(fakeProcedure, { goodId: "123", quantity: 1 })).toThrow(
        "Procedure must be in progress",
      )
    })
  })

  describe("persist", () => {
    it("persists the applied events", async () => {
      const { procedureFn, repo } = setUp()
      const fakeEvent = procedureCreatedEventFake({ aggregateId: "123" })

      repo.setup((r) => r.save([fakeEvent], 0))

      procedureFn.create(fakeEvent.data.animalId, fakeEvent.data.name)

      await procedureFn.persist([fakeEvent], 0)
    })
  })
})
