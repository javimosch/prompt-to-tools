import { ref } from "https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js";
export default function useSocket() {
  const socket = io();

  const socketRef = ref("");

  socket.on('connect', () => {
    console.log('Connected to socket server');
    socketRef.value = socket.id;
  });

  socket.on('requestCurlItemComplete', (data) => {
    window.mitt.emit('requestCurlItemComplete', data);
  });

  window.socket = socket;

  return {
    socketRef
  }
}
