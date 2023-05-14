import { Application } from "express"
import { ProcedureService } from "./procedureService"

export class ProcedureCommandApi {
  constructor(private readonly app: Application, private readonly service: ProcedureService) {}
  setUp() {
    this.app.post("/procedure/create", async (req, res) => {
      try {
        const event = await this.service.create(req.body.animalId, req.body.name)
        res.status(200).json({ message: "success", id: event.aggregateId })
      } catch (e) {
        res.status(400).json({ error: e.message, stack: e.stack })
      }
    })
    this.app.post("/procedure/begin", async (req, res) => {
      try {
        await this.service.begin(req.body.id, req.body.expectedVersion)
        res.status(200).json({ message: "success" })
      } catch (e) {
        res.status(400).json({ error: e.message, stack: e.stack })
      }
    })
    this.app.post("/procedure/finish", async (req, res) => {
      try {
        await this.service.finish(req.body.id, req.body.expectedVersion)
        res.status(200).json({ message: "success" })
      } catch (e) {
        res.status(400).json({ error: e.message, stack: e.stack })
      }
    })
    this.app.post("/procedure/consumeGood", async (req, res) => {
      try {
        await this.service.consumeGood(req.body.id, req.body.goodId, req.body.quantity, req.body.expectedVersion)
        res.status(200).json({ message: "success" })
      } catch (e) {
        res.status(400).json({ error: e.message, stack: e.stack })
      }
    })
  }
}
