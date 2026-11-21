import { io, type Socket } from "socket.io-client";

const SOCKET_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api$/, "") ??
  "";

export function createNamespacedSocket(namespace: string): Socket {
  return io(SOCKET_BASE + namespace, { autoConnect: false });
}
