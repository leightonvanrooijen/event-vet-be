import { GoodRepo } from "../../infra/goodRepo"
import { UnPricedOrder } from "../../domain/Invoice"
import { RequestedOrder } from "./command.types"

export class GoodService {
  constructor(private readonly goodRepo: GoodRepo) {}

  async addNameAndPricing(partialOrder: RequestedOrder): Promise<UnPricedOrder> {
    const goodIds = partialOrder.offers.map((offer) => offer.goodOffered.id)
    const goods = await this.goodRepo.getByIds(goodIds)
    const offersWithPricingAndName = partialOrder.offers.map((offer) => {
      const good = goods.find((good) => good.id === offer.goodOffered.id)
      return {
        ...offer,
        goodOffered: {
          id: good.id,
          name: good.name,
          price: good.price,
          type: good.type,
        },
      }
    })
    return { ...partialOrder, offers: offersWithPricingAndName }
  }
}
