const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const fomatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require('./utils/users');

const app = express();

const server = http.createServer(app);

const io = socketio(server);

//Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//Run when a client connects
const botName = 'ChatCord Bot';
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    //Welcome connect user
    socket.emit('message', fomatMessage(botName, 'Welcome to ChatCord'));

    //Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        fomatMessage(botName, `${user.username} has joined the chat`)
      );
    //Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //Listen for chat messages
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', fomatMessage(user.username, msg));
  });

  //Runs when a socket disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        fomatMessage(botName, `${user.username} has left the chat`)
      );
      //Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`App listening on port ${PORT}!`));
