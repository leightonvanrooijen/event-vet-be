import express, { Application } from "express"
import cors from "cors"
import { Server } from "socket.io"
import { ProcedureCommandApi } from "./app/command/command.api"
import { EventBroker } from "../packages/eventSourcing/eventBroker"
import { fakeProductCreatedEvents } from "./app/externalEvents/externalEvent.fake"
import { ProcedureQueryFactory } from "./app/query/ProcedureQueryFactory"
import { ProcedureCommandFactory } from "./app/command/procedureCommandFactory"

const setUpProcedureService = async (app: Application, io: Server, eventBroker: EventBroker) => {
  // Query side
  const writeHandler = await ProcedureQueryFactory.build(app, io, eventBroker)

  // Register query event handler
  eventBroker.registerHandler(writeHandler)

  // Command side
  const procedureCommand = ProcedureCommandFactory.build(eventBroker)
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
  const eventBroker = new EventBroker()
  await setUpProcedureService(app, io, eventBroker)

  await eventBroker.process(fakeProductCreatedEvents(20))

  return server
}
