import { Server } from "socket.io"

export class SocketIoNotifier {
  constructor(private readonly socket: Server) {}

  async notify(id: string) {
    console.log("event emitted")
    this.socket.emit("procedure updated", id)
  }
}
