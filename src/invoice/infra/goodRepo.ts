import { DataStore } from "../../packages/db/testDB"
import { IGood } from "../app/externalEvents/InEventHandler"

export class GoodRepo {
  constructor(private readonly goodRepo: DataStore<IGood>) {}

  async get(id: string) {
    return this.goodRepo.get(id)
  }

  async getByIds(ids: string[]) {
    const goods = await this.goodRepo.getAll()
    return goods.filter((good) => ids.includes(good.id))
  }

  async create(good: IGood) {
    return this.goodRepo.create(good)
  }
}
