import { Server } from "socket.io"
import { Thespian } from "thespian"

import { SocketIoNotifier } from "./socketIoNotifier"

describe("SocketIoNotifier", () => {
  describe("notify", () => {
    it("should emit a procedure updated socket event", () => {
      const thespian = new Thespian()
      const socket = thespian.mock<Server>("socket")

      socket.setup((s) => s.emit("procedure updated", "id"))

      const notifier = new SocketIoNotifier(socket.object)

      notifier.notify("id")

      thespian.verify()
    })
  })
})
