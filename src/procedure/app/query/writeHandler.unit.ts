import { Thespian } from "thespian"
import { WriteEvents, WriteHandler } from "./writeHandler"
import { DataStore } from "../../../packages/db/testDB"
import { TProcedure } from "../../domain/procedure"
import {
  goodConsumedEventFake,
  procedureBeganEventFake,
  procedureCreatedEventFake,
  procedureFake,
  procedureFinishedEventFake,
} from "../../domain/procedure.fake"
import { SocketIoNotifier } from "./socketIoNotifier"
import { applyVersion, Versioned } from "../../../packages/eventSourcing/applyVersion"

let thespian: Thespian
const setUp = () => {
  thespian = new Thespian()
  const db = thespian.mock<DataStore<Versioned<TProcedure>>>("db")
  const notifier = thespian.mock<SocketIoNotifier>("notifier")
  const writeHandler = new WriteHandler(new WriteEvents(), db.object, notifier.object)

  return { writeHandler, db, notifier }
}

afterEach(() => thespian.verify())

describe("writeHandler", () => {
  describe("handler", () => {
    it("should create a procedure if the create event is received", async () => {
      const { writeHandler, db, notifier } = setUp()

      const fake = applyVersion(procedureFake({ consumedGoods: [] }))
      const event = applyVersion(procedureCreatedEventFake({ data: fake }))

      db.setup((s) => s.create(fake)).returns(() => Promise.resolve(fake))
      notifier.setup((s) => s.notify(fake.id)).returns(() => Promise.resolve())

      await writeHandler.handle([event])
    })
    it("should begin a procedure if the begin event is received", async () => {
      const { writeHandler, db, notifier } = setUp()

      const fake = applyVersion(procedureFake({ status: "inProgress" }))
      const event = applyVersion(procedureBeganEventFake({ aggregateId: fake.id }))

      db.setup((s) => s.update({ id: fake.id, status: fake.status, version: fake.version })).returns(() =>
        Promise.resolve({ version: 1, ...fake }),
      )
      notifier.setup((s) => s.notify(fake.id)).returns(() => Promise.resolve())

      await writeHandler.handle([event])
    })
    it("should finish a procedure if the finish event is received", async () => {
      const { writeHandler, db, notifier } = setUp()

      const fake = applyVersion(procedureFake({ status: "finished" }))
      const event = applyVersion(procedureFinishedEventFake({ aggregateId: fake.id }))

      db.setup((s) => s.update({ id: fake.id, status: fake.status, version: 1 })).returns(() => Promise.resolve(fake))
      notifier.setup((s) => s.notify(fake.id)).returns(() => Promise.resolve())

      await writeHandler.handle([event])
    })
    it("should add the consumed good if the good consumed event is received", async () => {
      const { writeHandler, db, notifier } = setUp()

      const fake = applyVersion(procedureFake({ consumedGoods: [] }))
      const event = applyVersion(goodConsumedEventFake({ aggregateId: fake.id }))

      db.setup((s) => s.get(fake.id)).returns(() => Promise.resolve(fake))
      db.setup((s) =>
        s.update({
          id: fake.id,
          version: fake.version,
          consumedGoods: [{ quantity: event.data.quantity, goodId: event.data.goodId }],
        }),
      ).returns(() => Promise.resolve(fake))
      notifier.setup((s) => s.notify(fake.id)).returns(() => Promise.resolve())

      await writeHandler.handle([event])
    })
  })
})
