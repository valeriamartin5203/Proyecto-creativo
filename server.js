// ==========================================
// 🚀 IMPORTACIONES Y CONFIGURACIÓN
// ==========================================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Servir carpeta public
app.use(express.static("public"));


// ==========================================
// 👥 ALMACÉN DE JUGADORES
// ==========================================

const players = {};


// ==========================================
// 🎯 MINI JUEGO - ADIVINA EL NÚMERO
// ==========================================

// Número secreto global (lo controla el servidor)
let numeroSecreto = Math.floor(Math.random() * 20) + 1;

// Estado del juego
let juegoActivo = true;


// ==========================================
// 🔎 FUNCIÓN: OBTENER JUGADORES POR SALA
// ==========================================

function getPlayersInRoom(room) {
  const roomPlayers = {};
  for (let id in players) {
    if (players[id].room === room) {
      roomPlayers[id] = players[id];
    }
  }
  return roomPlayers;
}


// ==========================================
// 🔌 CONEXIÓN DE SOCKETS
// ==========================================

io.on("connection", (socket) => {

  console.log("🟢 Usuario conectado:", socket.id);


  // ==========================================
  // 🎮 CUANDO UN JUGADOR ENTRA AL JUEGO
  // ==========================================
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


  // ==========================================
  // 🚶 MOVIMIENTO DEL JUGADOR
  // ==========================================
  socket.on("move", (data) => {

    if (!players[socket.id]) return;

    players[socket.id].x = data.x;
    players[socket.id].y = data.y;
    players[socket.id].direction = data.direction;

    const room = players[socket.id].room;

    io.to(room).emit("playersUpdate", getPlayersInRoom(room));
  });


  // ==========================================
  // 🚪 CAMBIO DE SALA
  // ==========================================
  socket.on("changeRoom", (newRoom) => {

    if (!players[socket.id]) return;

    const oldRoom = players[socket.id].room;

    socket.leave(oldRoom);
    socket.join(newRoom);

    players[socket.id].room = newRoom;

    io.to(oldRoom).emit("playersUpdate", getPlayersInRoom(oldRoom));
    io.to(newRoom).emit("playersUpdate", getPlayersInRoom(newRoom));
  });


  // ==========================================
  // 💬 CHAT POR SALA
  // ==========================================
  socket.on("mensaje", (text) => {

    if (!players[socket.id]) return;

    const usuario = players[socket.id].name;
    const room = players[socket.id].room;

    io.to(room).emit("mensaje", {
      usuario,
      texto: text
    });
  });


  // ==========================================
  // 🎯 MINI JUEGO - INTENTO DE ADIVINAR
  // ==========================================
  socket.on("guessNumber", (data) => {

    if (!players[socket.id]) return;
    if (!juegoActivo) return;

    const numero = parseInt(data.numero);
    const jugador = players[socket.id];
    const room = jugador.room;

    // 👉 Si el número es correcto
    if (numero === numeroSecreto) {

      io.emit("gameMessage", {
        mensaje: `🎉 ${jugador.name} adivinó el número (${numeroSecreto})`
      });

      juegoActivo = false;

      // 🔄 Reiniciar después de 5 segundos
      setTimeout(() => {

        numeroSecreto = Math.floor(Math.random() * 20) + 1;
        juegoActivo = true;

        io.emit("gameMessage", {
          mensaje: "🔄 Nuevo número generado (1-20)"
        });

      }, 5000);

    } 
    // 👉 Si es menor
    else if (numero < numeroSecreto) {
      socket.emit("gameMessage", {
        mensaje: "📈 El número es mayor"
      });
    } 
    // 👉 Si es mayor
    else {
      socket.emit("gameMessage", {
        mensaje: "📉 El número es menor"
      });
    }
  });


  // ==========================================
  // ❌ CUANDO UN JUGADOR SE DESCONECTA
  // ==========================================
  socket.on("disconnect", () => {

    if (!players[socket.id]) return;

    const room = players[socket.id].room;

    delete players[socket.id];

    io.to(room).emit("playersUpdate", getPlayersInRoom(room));

    console.log("🔴 Usuario desconectado:", socket.id);
  });

});


// ==========================================
// ▶️ INICIAR SERVIDOR
// ==========================================

server.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});
