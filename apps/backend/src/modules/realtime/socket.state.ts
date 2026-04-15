import { Server } from 'socket.io'

let realtimeServer: Server | null = null

export function setRealtimeServer(server: Server | null) {
  realtimeServer = server
}

export function getRealtimeServer() {
  return realtimeServer
}
