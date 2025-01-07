require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const basicAuth = require('express-basic-auth');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3005; // Or any other port

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' })); // Configure JSON body parser with a limit
app.use('/', express.static('public')); // Configure static folder to root

// Basic Auth middleware for root route only (if credentials are configured)
if (process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD) {
  app.get('/', basicAuth({
    users: { [process.env.AUTH_USERNAME]: process.env.AUTH_PASSWORD },
    challenge: true,
    //realm: 'Protected Area'
  }));
}

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
