import { BrokerEvent } from "./eventBroker.types"

export interface Handler {
  handle(events: BrokerEvent[]): Promise<void>
}

export class EventBus {
  private handlers: Handler[] = []
  constructor() {}

  registerHandler(handler: Handler) {
    this.handlers.push(handler)
  }

  async process(events: BrokerEvent[]) {
    for (const handler of this.handlers) {
      await handler.handle(events)
    }
  }
}
