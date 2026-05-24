import { io } from 'socket.io-client';

const serverURL = import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

const socket = io(serverURL, {
  auth: {
    token: localStorage.getItem('token')
  },
  autoConnect: false
});

// Reconnect with fresh token when it changes
export function connectSocket() {
  const token = localStorage.getItem('token');
  if (token) {
    socket.auth = { token };
    socket.connect();
  }
}

export function disconnectSocket() {
  socket.disconnect();
}

export default socket;
