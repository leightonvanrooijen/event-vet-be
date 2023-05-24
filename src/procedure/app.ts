import express, { Application } from "express"
import cors from "cors"
import { Server } from "socket.io"
import { EventBus } from "../packages/eventSourcing/eventBus"
import { fakeProductCreatedEvents } from "./app/externalEvents/procedureInEvent.fake"
import { ProcedureQueryFactory } from "./app/query/ProcedureQueryFactory"
import { ProcedureCommandFactory } from "./app/command/procedureCommandFactory"
import { Good, ProcedureInEventHandler } from "./app/externalEvents/ProcedureInEventHandler"
import { TestDB } from "../packages/db/testDB"
import { InvoiceInEventHandler } from "../invoice/app/inEvents/InvoiceInEventHandler"
import { InvoiceProcedureService } from "../invoice/app/inEvents/InvoiceProcedureService"
import { InvoiceService } from "../invoice/app/command/invoiceService"
import { Invoice, InvoiceT } from "../invoice/domain/Invoice"
import { InvoiceRepo } from "../invoice/infra/InvoiceRepo"
import { TestEventDb } from "../packages/eventSourcing/testEventDb"
import { InvoiceChangeEvents } from "../invoice/domain/InvoiceChangeEvents"
import { InvoiceApplier } from "../invoice/domain/InvoiceApplier"
import { InvoiceHydrator } from "../invoice/domain/InvoiceHydrator"
import { GoodService } from "../invoice/app/command/GoodService"
import { GoodRepo } from "../invoice/infra/goodRepo"
import { IGood, InvoiceGoodService } from "../invoice/app/inEvents/InvoiceGoodService"
import { InvoiceWriteEvents, InvoiceWriteHandler } from "../invoice/app/query/InvoiceWriteHandler"
import { Versioned } from "../packages/eventSourcing/applyVersion"
import { InvoiceQueryApi } from "../invoice/app/query/InvoiceQueryApi"

export const setUpProcedureService = async (app: Application, io: Server, externalEventBus: EventBus) => {
  // External in events
  const goodDb = new TestDB<Good>([], "id")
  externalEventBus.registerHandler(new ProcedureInEventHandler(io, goodDb))

  // Query side
  const writeHandler = await ProcedureQueryFactory.build(app, io, goodDb)

  // Register write handler to receive events from command side
  const internalEventBus = new EventBus()
  internalEventBus.registerHandler(writeHandler)

  // Command side
  ProcedureCommandFactory.build(app, internalEventBus, externalEventBus)
}

export const setUpInvoiceService = async (app: Application, io: Server, externalEventBus: EventBus) => {
  // External in events
  const goodDb = new TestDB<IGood>([], "id")
  const goodRepo = new GoodRepo(goodDb)

  const internalEventBus = new EventBus()

  // Command side
  const commandDb = new TestEventDb(internalEventBus)
  const repo = new InvoiceRepo(commandDb)
  const event = new InvoiceChangeEvents()
  const applier = new InvoiceApplier()
  const hydrator = new InvoiceHydrator(event, applier)
  const invoice = new Invoice(repo, event, applier, hydrator)
  const goodService = new GoodService(goodRepo)
  const invoiceService = new InvoiceService(invoice, goodService)

  // Internal in event handling
  const procedureService = new InvoiceProcedureService(invoiceService)
  const invoiceGoodService = new InvoiceGoodService(io, goodRepo)
  const inEventHandler = new InvoiceInEventHandler()
  inEventHandler.addService(procedureService)
  inEventHandler.addService(invoiceGoodService)
  externalEventBus.registerHandler(inEventHandler)

  // Query side
  const queryDb = new TestDB<Versioned<InvoiceT>>([], "id")
  const writeEvents = new InvoiceWriteEvents()
  const writeHandler = new InvoiceWriteHandler(writeEvents, queryDb)
  new InvoiceQueryApi(app, queryDb).setUp()

  // register the write handler to receive events from command side
  internalEventBus.registerHandler(writeHandler)
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
  await setUpInvoiceService(app, io, eventBroker)

  await eventBroker.process(fakeProductCreatedEvents(20))

  return server
}
