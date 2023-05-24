import { Application } from "express"
import { Server } from "socket.io"
import { DataStore, TestDB } from "../../../packages/db/testDB"
import { Versioned } from "../../../packages/eventSourcing/applyVersion"
import { TProcedure } from "../../domain/procedure"
import { Good } from "../externalEvents/PInEventHandler"
import { QueryApi } from "./query.api"
import { SocketIoNotifier } from "./socketIoNotifier"
import { WriteEvents, WriteHandler } from "./writeHandler"

export class ProcedureQueryFactory {
  static async build(app: Application, io: Server, goodDb: DataStore<Good>) {
    const procedureDb = new TestDB<Versioned<TProcedure>>([], "id")

    new QueryApi(app, procedureDb, goodDb).setUp()
    const notifier = new SocketIoNotifier(io)
    const events = new WriteEvents()

    return new WriteHandler(events, procedureDb, notifier)
  }
}
