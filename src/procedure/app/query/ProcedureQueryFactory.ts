import { Application } from "express"
import { Server } from "socket.io"
import { EventBroker } from "../../../packages/eventSourcing/eventBroker"
import { TestDB } from "../../../packages/db/testDB"
import { Versioned } from "../../../packages/eventSourcing/applyVersion"
import { TProcedure } from "../../domain/procedure"
import { ExternalEventHandler, Good } from "../externalEvents/externalEventHandler"
import { QueryApi } from "./query.api"
import { SocketIoNotifier } from "./socketIoNotifier"
import { WriteEvents, WriteHandler } from "./writeHandler"

export class ProcedureQueryFactory {
  static async build(app: Application, io: Server, eventBroker: EventBroker) {
    const procedureDb = new TestDB<Versioned<TProcedure>>([], "id")
    const goodDb = new TestDB<Good>([], "id")

    const eventHandler = new ExternalEventHandler(io, goodDb)
    eventBroker.registerHandler(eventHandler)

    new QueryApi(app, procedureDb, goodDb).setUp()
    const notifier = new SocketIoNotifier(io)
    const events = new WriteEvents()

    return new WriteHandler(events, procedureDb, notifier)
  }
}
