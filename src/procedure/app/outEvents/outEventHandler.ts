import { ProcedureEvents } from "../../domain/procedure.changeEvents"

type Handler = {
  handle: (events: ProcedureEvents[]) => Promise<void>
}
export class OutEventHandler {
  private readonly handlers: Handler[] = []
  constructor() {}

  async handle(events: ProcedureEvents[]) {
    for await (const handler of this.handlers) {
      await handler.handle(events)
    }
  }

  register(handler: Handler) {
    this.handlers.push(handler)
  }
}
