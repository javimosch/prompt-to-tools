import { ref, inject } from "/lib/vue.esm-browser.prod.js";
export default function useSocket() {
  const socket = io();

  const socketRef = ref("");

  socket.on('connect', () => {
    console.log('Connected to socket server');
    socketRef.value = socket.id;
  });

  function testToast() {
    const sampleData = {
      message: 'This is a test toast message!',
      type: 'info' // You can specify the type if needed
    };
    //const showToast = inject('showToast');

    window.showToast(sampleData);

  }
  window.testToast = testToast;

  socket.on('thinking', (data) => {
    console.log('Socket: got thinking', {
      data
    });

    window.showToast(data);

  });

  socket.on('requestCurlItemComplete', (data) => {
    console.log('Socket: got requestCurlItemComplete', data);
    window.mitt.emit('requestCurlItemComplete', data);
  });

  socket.on('requestSqlItemComplete', (data) => {
    console.log('Socket: got requestSqlItemComplete', data);
    window.mitt.emit('requestSqlItemComplete', data);
  });

  socket.on('promptResponse', (response) => {
    // No implementation provided in the instructions
  });

  socket.on('requestChartItemComplete', (chartConfig) => {
    console.log('Chart configuration received:', chartConfig);
    window.mitt.emit('add-item', chartConfig);
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
