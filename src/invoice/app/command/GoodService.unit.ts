import { GoodRepo } from "../../infra/goodRepo"
import { Thespian } from "thespian"
import { GoodService } from "./GoodService"
import { goodFake, requestedOfferFake, requestedOrderFake } from "../../domain/Invoice.fake"
import { assertThat } from "mismatched"

describe("GoodService", () => {
  describe("addNameAndPricing", () => {
    it("adds name and pricing to a partial order", async () => {
      const thespian = new Thespian()
      const goodRepo = thespian.mock<GoodRepo>("GoodRepo")
      const goodService = new GoodService(goodRepo.object)

      const fakeGood = goodFake({ price: 100 })
      const partialOffer = requestedOfferFake({ goodOffered: { id: fakeGood.id } })
      const partialOrder = requestedOrderFake({ offers: [partialOffer] })

      goodRepo
        .setup((g) => g.getByIds(partialOrder.offers.map((offer) => offer.goodOffered.id)))
        .returns(() => Promise.resolve([fakeGood]))

      const order = await goodService.addNameAndPricing(partialOrder)

      assertThat(order).is({
        ...partialOrder,
        offers: [
          {
            ...partialOffer,
            goodOffered: {
              id: fakeGood.id,
              name: fakeGood.name, // added
              price: fakeGood.price, // added
              type: fakeGood.type,
            },
          },
        ],
      })
      thespian.verify()
    })
  })
})
