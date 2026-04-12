import { io } from "socket.io-client";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
export const socket = io(BACKEND_URL, {
  autoConnect: false,
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 20000,
});
