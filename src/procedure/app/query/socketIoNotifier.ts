import { Server } from "socket.io"

// TODO make this generic
export class SocketIoNotifier {
  constructor(private readonly socket: Server) {}

  async notify(id: string) {
    this.socket.emit("procedure updated", id)
  }
}
