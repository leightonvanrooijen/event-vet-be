import { ChangeEvent } from "./changeEvent.types"
import { TestEventDb } from "./testEventDb"
import { changeEventFakes, versionedChangeEventFakes } from "./changeEvent.fake"
import { EventBus } from "./eventBus"
import { Thespian } from "thespian"

const setUp = (defaultStore, eventBroker = new EventBus()) => {
  const testEventDb = new TestEventDb(eventBroker, defaultStore)

  return { testEventDb }
}

const aggregateId = "123"
const overwrites: Partial<ChangeEvent<any>>[] = [{ aggregateId }, { aggregateId }]

describe("buildTestEventDb", () => {
  describe("saveEvents", () => {
    it("creates and saves events to the DB matching using eventId provided if one does not exist", async () => {
      const Db = {}
      const changeEvents = changeEventFakes()(2, overwrites)
      const { testEventDb } = setUp(Db)

      await testEventDb.saveEvents(changeEvents, 0)

      expect(Db[aggregateId]).toHaveLength(2)
    })
    it("appends events to the DB matching the eventId provided if one exists", async () => {
      const changeEvents = versionedChangeEventFakes()(2, [{ aggregateId }, { aggregateId }])
      const changeEventsToAdd = changeEventFakes()(2, [{ aggregateId }, { aggregateId }])
      const Db = { [aggregateId]: changeEvents }
      const { testEventDb } = setUp(Db)

      await testEventDb.saveEvents(changeEventsToAdd, 1)

      expect(Db[aggregateId]).toHaveLength(4)
      expect(Db[aggregateId][3]).toEqual(expect.objectContaining({ ...changeEventsToAdd[1] }))
    })
    it("calls the event bus process with the saved events", async () => {
      const thespian = new Thespian()
      const broker = thespian.mock<EventBus>("handler")

      const changeEvents = changeEventFakes()(2, overwrites)

      broker
        .setup((s) =>
          s.process([
            { version: 1, ...changeEvents[0] },
            { version: 2, ...changeEvents[1] },
          ]),
        )
        .returns(() => Promise.resolve())

      const { testEventDb } = setUp({}, broker.object)

      await testEventDb.saveEvents(changeEvents, 0)

      thespian.verify()
    })
  })
  describe("getEvents", () => {
    it("returns an array of events matching the ID provided", async () => {
      const DbData = { [aggregateId]: changeEventFakes()(2, overwrites) }
      const { testEventDb } = setUp(DbData)

      const events = await testEventDb.getEvents(aggregateId)

      expect(events).toEqual(DbData[aggregateId])
    })
    it("returns an empty array if no matching ID is found", async () => {
      const { testEventDb } = setUp({})

      const events = await testEventDb.getEvents("id")

      expect(events).toEqual([])
    })
  })
})
