// fix this up to be composed
export type RequestedOffer = {
  goodOffered: { id: string }
  typeOfGood: "product"
  quantity: number
  businessFunction: "sell"
}

export type RequestedOrder = {
  type: "procedure"
  aggregateId: string
  name: string
  offers: RequestedOffer[]
}
