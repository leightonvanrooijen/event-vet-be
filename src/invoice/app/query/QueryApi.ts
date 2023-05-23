import { Api } from "../../../packages/api/api"
import { Application } from "express"
import { DataStore } from "../../../packages/db/testDB"
import { Versioned } from "../../../packages/eventSourcing/applyVersion"
import { InvoiceT } from "../../domain/Invoice"

export class QueryApi implements Api {
  constructor(private readonly app: Application, private readonly invoiceRepo: DataStore<Versioned<InvoiceT>>) {}
  setUp(): void {
    this.getRoute()
  }

  getRoute(): void {
    this.app.get("/invoice/:id", async (req, res) => {
      try {
        const invoice = await this.invoiceRepo.get(req.params.id)
        if (!invoice) return res.status(400).json({ error: "Invoice not found" })

        res.status(200).json(invoice)
      } catch (e) {
        res.status(400).json({ error: e.message })
      }
    })
  }
}
