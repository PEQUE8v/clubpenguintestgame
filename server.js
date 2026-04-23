const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// In-memory state
const players = {}; // socketId -> { id, username, color, x, y, room, message, messageTime }
const roomPlayerCounts = { town: 0, beach: 0, dance: 0 };

const ROOMS = ['town', 'beach', 'dance'];
const ROOM_SPAWN = {
  town:  { x: 400, y: 300 },
  beach: { x: 400, y: 300 },
  dance: { x: 400, y: 300 },
};

function getRoomCounts() {
  const counts = { town: 0, beach: 0, dance: 0 };
  for (const p of Object.values(players)) {
    if (counts[p.room] !== undefined) counts[p.room]++;
  }
  return counts;
}

function broadcastRoomCounts() {
  io.emit('roomCounts', getRoomCounts());
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', ({ username, color }) => {
    const room = 'town';
    const spawn = ROOM_SPAWN[room];
    players[socket.id] = {
      id: socket.id,
      username: username.slice(0, 20),
      color,
      x: spawn.x + Math.random() * 60 - 30,
      y: spawn.y + Math.random() * 60 - 30,
      room,
      message: '',
      messageTime: 0,
    };

    socket.join(room);

    // Send current room state to new player
    const roomPlayers = Object.values(players).filter(p => p.room === room);
    socket.emit('init', { self: players[socket.id], players: roomPlayers, roomCounts: getRoomCounts() });

    // Notify others in same room
    socket.to(room).emit('playerJoined', players[socket.id]);

    broadcastRoomCounts();
    console.log(`${username} joined room ${room}`);
  });

  socket.on('move', ({ x, y }) => {
    const player = players[socket.id];
    if (!player) return;
    player.x = Math.max(0, Math.min(800, x));
    player.y = Math.max(0, Math.min(600, y));
    socket.to(player.room).emit('playerMoved', { id: socket.id, x: player.x, y: player.y });
  });

  socket.on('chat', (message) => {
    const player = players[socket.id];
    if (!player) return;
    player.message = String(message).slice(0, 80);
    player.messageTime = Date.now();
    io.to(player.room).emit('playerChat', { id: socket.id, message: player.message });
  });

  socket.on('changeRoom', (newRoom) => {
    const player = players[socket.id];
    if (!player || !ROOMS.includes(newRoom) || player.room === newRoom) return;

    const oldRoom = player.room;
    socket.leave(oldRoom);
    socket.to(oldRoom).emit('playerLeft', socket.id);

    player.room = newRoom;
    const spawn = ROOM_SPAWN[newRoom];
    player.x = spawn.x + Math.random() * 60 - 30;
    player.y = spawn.y + Math.random() * 60 - 30;
    player.message = '';

    socket.join(newRoom);

    const roomPlayers = Object.values(players).filter(p => p.room === newRoom);
    socket.emit('roomChanged', { room: newRoom, players: roomPlayers, self: player });
    socket.to(newRoom).emit('playerJoined', player);

    broadcastRoomCounts();
    console.log(`${player.username} moved to room ${newRoom}`);
  });

  socket.on('disconnect', () => {
    const player = players[socket.id];
    if (!player) return;
    socket.to(player.room).emit('playerLeft', socket.id);
    delete players[socket.id];
    broadcastRoomCounts();
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});