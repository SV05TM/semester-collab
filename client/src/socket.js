import { io } from 'socket.io-client';

// In production, the client is served from the same origin as the server
// In development, we connect to localhost:3001
const serverURL = import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

const socket = io(serverURL);

export default socket;
