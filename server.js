const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// En esta parte se guardan los usuatios conectados
const players = {};

io.on("connection", (socket) => {
    console.log("🟢 Usuario conectado:", socket.id); 

    // Cuando un jugador entra al juego
    socket.on("joinGame", (username) => {
        players[socket.id] = {
            id: socket.id,
            name: username,
            x: 100,
            y: 100,
            room: "plaza"
        };

        socket.join("plaza");

        // Enviamos los jugadores actuales
        io.to("plaza").emit("playersUpdate", players);
    });

    // Movimiento del jugador
    socket.on("move", (data) => {
        if (!players[socket.id]) return;

        players[socket.id].x = data.x;
        players[socket.id].y = data.y;

        io.to(players[socket.id].room).emit("playersUpdate", players);
    });

    // Cambio de sala
    socket.on("changeRoom", (newRoom) => {
        if (!players[socket.id]) return;

        const oldRoom = players[socket.id].room;

        socket.leave(oldRoom);
        socket.join(newRoom);

        players[socket.id].room = newRoom;

        io.emit("playersUpdate", players);
    });

    // Desconexión
    socket.on("disconnect", () => {
        console.log("🔴 Usuario desconectado:", socket.id);
        delete players[socket.id];
        io.emit("playersUpdate", players);
    });
});

server.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});
