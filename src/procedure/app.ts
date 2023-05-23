import express, { Application } from "express"
import cors from "cors"
import { QueryApi } from "./app/query/query.api"
import { TestDB } from "../packages/db/testDB"
import { Procedure, TProcedure } from "./domain/procedure"
import { WriteEvents, WriteHandler } from "./app/query/writeHandler"
import { Server } from "socket.io"
import { SocketIoNotifier } from "./app/query/socketIoNotifier"
import { TestEventDb } from "../packages/eventSourcing/testEventDb"
import { ProcedureService } from "./app/command/procedureService"
import { ProcedureRepo } from "./infra/procedureRepo"
import { ProcedureApplier } from "./domain/procedure.applier"
import { ProcedureHydrator } from "./domain/procedure.hydrator"
import { ProcedureCommandApi } from "./app/command/command.api"
import { ProcedureChangeEvents } from "./domain/procedure.changeEvents"
import { EventBroker } from "../packages/eventSourcing/eventBroker"
import { ExternalEventHandler, Good } from "./app/externalEvents/externalEventHandler"
import { fakeProductCreatedEvents } from "./app/externalEvents/externalEvent.fake"
import { Versioned } from "../packages/eventSourcing/applyVersion"

export class ProcedureQueryFactory {
  static async build(app: Application, io: Server) {
    const procedureDb = new TestDB<Versioned<TProcedure>>([], "id")
    const goodDb = new TestDB<Good>([], "id")

    const eventHandler = new ExternalEventHandler(io, goodDb)

    // Create fake goods
    await eventHandler.handle(fakeProductCreatedEvents(20))

    new QueryApi(app, procedureDb, goodDb).setUp()
    const notifier = new SocketIoNotifier(io)
    const events = new WriteEvents()

    return new WriteHandler(events, procedureDb, notifier)
  }
}

export class ProcedureServiceFactory {
  static build(eventBroker: EventBroker) {
    const commandDb = new TestEventDb(eventBroker)
    const repo = new ProcedureRepo(commandDb)
    const event = new ProcedureChangeEvents()
    const applier = new ProcedureApplier()
    const hydrator = new ProcedureHydrator(event, applier)

    const procedure = new Procedure(repo, event, applier, hydrator)
    return new ProcedureService(procedure)
  }
}

const setUpProcedureService = async (app: Application, io: Server) => {
  // Query side
  const writeHandler = await ProcedureQueryFactory.build(app, io)

  // Register query event handler
  const eventBroker = new EventBroker()
  eventBroker.registerHandler(writeHandler)

  // Command side
  const procedureService = ProcedureServiceFactory.build(eventBroker)
  new ProcedureCommandApi(app, procedureService).setUp()
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

  await setUpProcedureService(app, io)

  return server
}
