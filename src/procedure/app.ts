import express, { Application } from "express"
import cors from "cors"
import { Server } from "socket.io"
import { ProcedureCommandApi } from "./app/command/command.api"
import { EventBus } from "../packages/eventSourcing/eventBus"
import { fakeProductCreatedEvents } from "./app/externalEvents/pInEvent.fake"
import { ProcedureQueryFactory } from "./app/query/ProcedureQueryFactory"
import { ProcedureCommandFactory } from "./app/command/procedureCommandFactory"
import { Good, PInEventHandler } from "./app/externalEvents/PInEventHandler"
import { TestDB } from "../packages/db/testDB"

export const setUpProcedureService = async (app: Application, io: Server, eventBus: EventBus) => {
  // External in events
  const goodDb = new TestDB<Good>([], "id")
  eventBus.registerHandler(new PInEventHandler(io, goodDb))

  // Query side
  const writeHandler = await ProcedureQueryFactory.build(app, io, goodDb)

  // Register write handler to receive events from command side
  const internalEventBus = new EventBus()
  internalEventBus.registerHandler(writeHandler)

  // Command side
  const procedureCommand = ProcedureCommandFactory.build(internalEventBus)
  new ProcedureCommandApi(app, procedureCommand).setUp()
}

export const app = async (port = 4000) => {
  const app: Application = express()

  app.use(cors())
  app.use(express.json())

  const server = await app.listen(port, () => console.log(`Server is listening on port ${port}!`))
  const io = new Server(server)

  io.on("connection", (socket) => {
    console.log("a user connected")

    socket.on("disconnect", () => {
      console.log("user disconnected")
    })
  })

  // TODO separate internal and external events
  const eventBroker = new EventBus()
  await setUpProcedureService(app, io, eventBroker)

  await eventBroker.process(fakeProductCreatedEvents(20))

  return server
}
