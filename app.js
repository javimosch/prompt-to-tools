require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3005; // Or any other port

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' })); // Configure JSON body parser with a limit
app.use('/', express.static('public')); // Configure static folder to root
app.set('view engine', 'ejs');

global.app = app;
require('./routes/http-routes');
require('./routes/api-routes');

const ioService = require('./services/io-service')(io)
io.on('connection', (socket) => {
  ioService.configureSocket(socket)
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
global.io = io

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
