import { ChangeEvent } from "../../../packages/eventSourcing/changeEvent.types"

export type IExternalEvents = ChangeEvent<any>

export type EventHandler = {
  handle(event: IExternalEvents): Promise<void>
}

export class InvoiceInEventHandler {
  private readonly services: EventHandler[] = []
  constructor() {}

  // TODO replace this with the generic solution
  addService(service: EventHandler) {
    this.services.push(service)
  }

  // work out ordering and if I can handle these async or something
  async handle(events: IExternalEvents[]) {
    for await (const event of events) {
      for await (const service of this.services) {
        await service.handle(event)
      }
    }
  }
}
