import { Server } from "socket.io"

export class SocketIoNotifier {
  constructor(private readonly socket: Server) {}

  async notify(id: string) {
    this.socket.emit("procedure updated", id)
  }
}
