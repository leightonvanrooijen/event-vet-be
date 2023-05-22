import { Thespian } from "thespian"
import { ProcedureChangeEvents } from "../../domain/procedure.changeEvents"
import { WriteHandler } from "./writeHandler"
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

let thespian: Thespian
const setUp = () => {
  thespian = new Thespian()
  const db = thespian.mock<DataStore<TProcedure>>("db")
  const notifier = thespian.mock<SocketIoNotifier>("notifier")
  const writeHandler = new WriteHandler(new ProcedureChangeEvents(), db.object, notifier.object)

  return { writeHandler, db, notifier }
}

afterEach(() => thespian.verify())

describe("writeHandler", () => {
  describe("handler", () => {
    it("should create a procedure if the create event is received", async () => {
      const { writeHandler, db, notifier } = setUp()

      const fake = procedureFake()
      const event = procedureCreatedEventFake({ data: fake })

      db.setup((s) => s.create(fake)).returns(() => Promise.resolve(fake))
      notifier.setup((s) => s.notify(fake.id)).returns(() => Promise.resolve())

      await writeHandler.handle([event])
    })
    it("should begin a procedure if the begin event is received", async () => {
      const { writeHandler, db, notifier } = setUp()

      const fake = procedureFake({ status: "inProgress" })
      const event = procedureBeganEventFake({ aggregateId: fake.id })

      db.setup((s) => s.update({ id: fake.id, status: fake.status })).returns(() => Promise.resolve(fake))
      notifier.setup((s) => s.notify(fake.id)).returns(() => Promise.resolve())

      await writeHandler.handle([event])
    })
    it("should finish a procedure if the finish event is received", async () => {
      const { writeHandler, db, notifier } = setUp()

      const fake = procedureFake({ status: "finished" })
      const event = procedureFinishedEventFake({ aggregateId: fake.id })

      db.setup((s) => s.update({ id: fake.id, status: fake.status })).returns(() => Promise.resolve(fake))
      notifier.setup((s) => s.notify(fake.id)).returns(() => Promise.resolve())

      await writeHandler.handle([event])
    })
    it("should add the consumed good if the good consumed event is received", async () => {
      const { writeHandler, db, notifier } = setUp()

      const fake = procedureFake({ consumedGoods: [] })
      const event = goodConsumedEventFake({ aggregateId: fake.id })

      db.setup((s) => s.get(fake.id)).returns(() => Promise.resolve(fake))
      db.setup((s) =>
        s.update({ id: fake.id, consumedGoods: [{ quantity: event.data.quantity, goodId: event.data.goodId }] }),
      ).returns(() => Promise.resolve(fake))
      notifier.setup((s) => s.notify(fake.id)).returns(() => Promise.resolve())

      await writeHandler.handle([event])
    })
  })
})
