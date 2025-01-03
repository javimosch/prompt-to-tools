import { ref } from "/lib/vue.esm-browser.prod.js";
export default function useSocket() {
  const socket = io();

  const socketRef = ref("");

  socket.on('connect', () => {
    console.log('Connected to socket server');
    socketRef.value = socket.id;
  });

  socket.on('requestCurlItemComplete', (data) => {
    console.log('Socket: got requestCurlItemComplete', data);
    window.mitt.emit('requestCurlItemComplete', data);
  });

  socket.on('requestSqlItemComplete', (data) => {
    console.log('Socket: got requestSqlItemComplete', data);
    window.mitt.emit('requestSqlItemComplete', data);
  });

  socket.on('requestTableItemComplete', (data) => {
    console.log('Socket: got requestTableItemComplete', data);
    window.mitt.emit('requestTableItemComplete', data);
  });

  socket.on('requestTableItemPartial', (data) => {
    console.log('Socket: got requestTableItemPartial', data);
    window.mitt.emit('requestTableItemPartial', data);
  });

  window.socket = socket;

  return {
    socketRef
  }
}
