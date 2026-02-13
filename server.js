const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const players = {};

// 🔹 Obtener jugadores por sala
function getPlayersInRoom(room) {
  const roomPlayers = {};
  for (let id in players) {
    if (players[id].room === room) {
      roomPlayers[id] = players[id];
    }
  }
  return roomPlayers;
}

io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado:", socket.id);

  socket.on("joinGame", (data) => {
    players[socket.id] = {
      id: socket.id,
      name: data.username,
      x: data.x ?? 375,
      y: data.y ?? 225,
      room: data.room ?? "plaza",
      direction: data.direction ?? "down"
    };

    socket.join(players[socket.id].room);

    io.to(players[socket.id].room).emit(
      "playersUpdate",
      getPlayersInRoom(players[socket.id].room)
    );
  });

  socket.on("move", (data) => {
    if (!players[socket.id]) return;

    players[socket.id].x = data.x;
    players[socket.id].y = data.y;
    players[socket.id].direction = data.direction;

    const room = players[socket.id].room;

    io.to(room).emit("playersUpdate", getPlayersInRoom(room));
  });

  socket.on("changeRoom", (newRoom) => {
    if (!players[socket.id]) return;

    const oldRoom = players[socket.id].room;

    socket.leave(oldRoom);
    socket.join(newRoom);

    players[socket.id].room = newRoom;

    io.to(oldRoom).emit("playersUpdate", getPlayersInRoom(oldRoom));
    io.to(newRoom).emit("playersUpdate", getPlayersInRoom(newRoom));
  });

  socket.on("mensaje", (text) => {
    if (!players[socket.id]) return;

    const usuario = players[socket.id].name;
    const room = players[socket.id].room;

    io.to(room).emit("mensaje", {
      usuario,
      texto: text
    });
  });

  socket.on("disconnect", () => {
    if (!players[socket.id]) return;

    const room = players[socket.id].room;

    delete players[socket.id];

    io.to(room).emit("playersUpdate", getPlayersInRoom(room));

    console.log("🔴 Usuario desconectado:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
