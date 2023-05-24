import { Application } from "express"
import { DataStore } from "../../../packages/db/testDB"
import { ConsumedGood, TProcedure } from "../../domain/procedure"
import { Good } from "../externalEvents/ProcedureInEventHandler"

export class QueryApi {
  constructor(
    private readonly app: Application,
    private readonly procedureRepo: DataStore<TProcedure>,
    private readonly goodRepo: DataStore<Good>,
  ) {}
  setUp() {
    this.getAllRoute()
    this.getRoute()
    this.getAllGoodsRoute()
  }

  getRoute() {
    this.app.get("/procedure/:id", async (req, res) => {
      try {
        const procedure = await this.procedureRepo.get(req.params.id)
        if (!procedure) return res.status(400).json({ error: "Procedure not found" })

        const goods = await this.goodRepo.getAll()

        const mapped = {
          ...procedure,
          consumedGoods: procedure?.consumedGoods.map((good) => {
            return {
              ...good,
              name: goods.find((dbGood) => dbGood.id === good.goodId)?.name,
            } as ConsumedGood
          }),
        }

        res.status(200).json(mapped)
      } catch (e) {
        res.status(400).json({ error: e.message })
      }
    })
  }

  getAllRoute() {
    this.app.get("/procedure/all", async (req, res) => {
      try {
        const procedures = await this.procedureRepo.getAll()
        res.status(200).json(procedures)
      } catch (e) {
        res.status(400).json({ error: e.message })
      }
    })
  }

  getAllGoodsRoute() {
    this.app.get("/procedure/good/all", async (req, res) => {
      try {
        const goods = await this.goodRepo.getAll()
        res.status(200).json(goods)
      } catch (e) {
        res.status(400).json({ error: e.message })
      }
    })
  }
}
