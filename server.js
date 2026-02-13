// ==========================================
// 🌐 SERVIDOR NODE.JS + SOCKET.IO
// ==========================================
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static("public"));

// ==========================================
// 👥 ESTADO GLOBAL DE JUGADORES
// Cada jugador se guarda aquí con:
// id, nombre, posición, sala actual, dirección
// ==========================================
const players = {};

// ==========================================
// 🔌 CONEXIONES
// ==========================================
io.on("connection", (socket) => {
    console.log("🟢 Usuario conectado:", socket.id);

    // ==========================================
    // 👤 UNIRSE AL JUEGO
    // ==========================================
    socket.on("joinGame", (username) => {

        // Crear jugador con estado inicial
        players[socket.id] = {
            id: socket.id,
            name: username,
            x: 100,
            y: 100,
            room: "plaza",
            direction: "down" // 🔥 dirección inicial
        };

        // Unir socket a la sala "plaza"
        socket.join("plaza");

        // Enviar estado de todos los jugadores a la sala
        io.to("plaza").emit("playersUpdate", players);

        console.log(`✅ ${username} se unió al juego en la plaza`);
    });

    // ==========================================
    // 🎯 MOVIMIENTO DEL JUGADOR
    // ==========================================
    socket.on("move", (data) => {
        if (!players[socket.id]) return;

        // Actualizamos posición y dirección del jugador
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
        players[socket.id].direction = data.direction || "down";

        // Enviar actualización solo a la sala actual del jugador
        io.to(players[socket.id].room).emit("playersUpdate", players);
    });

    // ==========================================
    // 🚪 CAMBIO DE SALA
    // ==========================================
    socket.on("changeRoom", (newRoom) => {
        if (!players[socket.id]) return;

        const oldRoom = players[socket.id].room;

        // Salir de la sala actual y unirse a la nueva
        socket.leave(oldRoom);
        socket.join(newRoom);

        // Actualizar estado del jugador
        players[socket.id].room = newRoom;

        // Enviar actualización a la nueva sala
        io.to(newRoom).emit("playersUpdate", players);

        console.log(`🚪 ${players[socket.id].name} se movió de ${oldRoom} a ${newRoom}`);
    });

    // ==========================================
    // 💬 CHAT
    // ==========================================
    socket.on("mensaje", (data) => {
        const usuario = players[socket.id]?.name || "Jugador";

        // Enviar mensaje solo a la sala actual
        io.to(players[socket.id]?.room || "plaza").emit("mensaje", {
            usuario,
            texto: data
        });

        console.log(`💬 [${usuario}]: ${data}`);
    });

    // ==========================================
    // ❌ DESCONEXIÓN
    // ==========================================
    socket.on("disconnect", () => {
        if (players[socket.id]) {
            console.log(`🔴 ${players[socket.id].name} se desconectó`);
        }

        delete players[socket.id];

        // Actualizar todos los clientes
        io.emit("playersUpdate", players);
    });
});

// ==========================================
// 🏁 INICIAR SERVIDOR
// ==========================================
server.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});
