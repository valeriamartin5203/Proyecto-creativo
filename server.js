const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const players = {};

io.on("connection", (socket) => {
    console.log("🟢 Usuario conectado:", socket.id);

    socket.on("joinGame", (username) => {
        players[socket.id] = {
            id: socket.id,
            name: username,
            x: 100,
            y: 100,
            room: "plaza"
        };

        socket.join("plaza");
        io.to("plaza").emit("playersUpdate", players);
    });

    socket.on("move", (data) => {
        if (!players[socket.id]) return;

        players[socket.id].x = data.x;
        players[socket.id].y = data.y;

        io.to(players[socket.id].room).emit("playersUpdate", players);
    });

    socket.on("changeRoom", (newRoom) => {
        if (!players[socket.id]) return;

        socket.leave(players[socket.id].room);
        socket.join(newRoom);
        players[socket.id].room = newRoom;

        io.emit("playersUpdate", players);
    });

    // ✅ CHAT
    socket.on("mensaje", (data) => {
        io.to(players[socket.id]?.room || "plaza").emit("mensaje", {
            usuario: players[socket.id]?.name || "Jugador",
            texto: data
        });
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("playersUpdate", players);
    });
});

server.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});
