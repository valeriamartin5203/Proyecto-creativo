// ==========================================
// 🎮 CONEXIÓN AL SERVIDOR
// ==========================================
const socket = io();

// Pedimos nombre
const username = prompt("Ingresa tu nombre de usuario:") || "Invitado";

// Enviamos nombre al servidor
socket.emit("joinGame", username);

// ==========================================
// 📦 ELEMENTOS DEL DOM
// ==========================================
const game = document.getElementById("game");
const mensajes = document.getElementById("mensajes");
const texto = document.getElementById("texto");

// ==========================================
// 👤 ESTADO DEL JUGADOR
// ==========================================
let myPosition = { x: 375, y: 225 };
let currentRoom = "plaza";
let currentDirection = "down"; // dirección inicial

// Enviar posición inicial con dirección
socket.emit("move", { ...myPosition, direction: currentDirection });

// Fondo inicial
game.classList.add(currentRoom);

// ==========================================
// 🧱 OBJETOS Y COLISIONES POR SALA
// ==========================================
const roomObjects = {
    plaza: [
        { name: "fuente", x: 300, y: 200, width: 50, height: 50 },
        { name: "arbol", x: 500, y: 300, width: 60, height: 80 }
    ],
    cafe: [
        { name: "mesa", x: 400, y: 250, width: 60, height: 40 }
    ]
};

// ==========================================
// 🚧 FUNCIÓN DE COLISIÓN
// ==========================================
function isColliding(newX, newY) {
    const playerWidth = 45;
    const playerHeight = 45;

    const objects = roomObjects[currentRoom] || [];
    for (let obj of objects) {
        if (
            newX < obj.x + obj.width &&
            newX + playerWidth > obj.x &&
            newY < obj.y + obj.height &&
            newY + playerHeight > obj.y
        ) return true;
    }

    return false;
}

// ==========================================
// 👥 ACTUALIZACIÓN DE JUGADORES
// ==========================================
socket.on("playersUpdate", (players) => {
    game.innerHTML = "";

    for (const id in players) {
        const player = players[id];
        if (player.room !== currentRoom) continue;

        const playerElement = document.createElement("div");

        // Clase según dirección
        playerElement.className = `player ${player.direction || "down"}`;
        playerElement.id = id;

        playerElement.style.left = player.x + "px";
        playerElement.style.top = player.y + "px";

        // Nombre arriba del jugador
        const name = document.createElement("span");
        name.textContent = player.name;

        playerElement.appendChild(name);
        game.appendChild(playerElement);
    }

    drawCollisions();
});

// ==========================================
// 🎯 MOVIMIENTO DEL JUGADOR
// ==========================================
document.addEventListener("keydown", (e) => {
    const speed = 10;
    let newX = myPosition.x;
    let newY = myPosition.y;

    // Actualizar posición y dirección según tecla
    if (e.key === "ArrowUp") { newY -= speed; currentDirection = "up"; }
    if (e.key === "ArrowDown") { newY += speed; currentDirection = "down"; }
    if (e.key === "ArrowLeft") { newX -= speed; currentDirection = "left"; }
    if (e.key === "ArrowRight") { newX += speed; currentDirection = "right"; }

    // Limitar dentro del mapa
    newX = Math.max(0, Math.min(755, newX));
    newY = Math.max(0, Math.min(455, newY));

    if (!isColliding(newX, newY)) {
        myPosition.x = newX;
        myPosition.y = newY;

        // Enviar posición + dirección al servidor
        socket.emit("move", { ...myPosition, direction: currentDirection });
    }
});

// ==========================================
// 🚪 CAMBIO DE SALA
// ==========================================
function changeRoom(newRoom) {
    socket.emit("changeRoom", newRoom);

    game.classList.remove(currentRoom);
    game.classList.add(newRoom);

    currentRoom = newRoom;
    game.innerHTML = "";

    myPosition = { x: 375, y: 225 };

    socket.emit("move", { ...myPosition, direction: currentDirection });
}

// ==========================================
// 💬 CHAT
// ==========================================
socket.on("mensaje", (data) => {
    const p = document.createElement("p");
    p.textContent = `${data.usuario}: ${data.texto}`;
    mensajes.appendChild(p);
    mensajes.scrollTop = mensajes.scrollHeight;
});

function enviar() {
    if (texto.value.trim() === "") return;
    socket.emit("mensaje", texto.value);
    texto.value = "";
}

// ==========================================
// 🟥 DEBUG VISUAL DE COLISIONES
// ==========================================
function drawCollisions() {
    const objects = roomObjects[currentRoom] || [];

    for (let obj of objects) {
        const box = document.createElement("div");
        box.style.position = "absolute";
        box.style.left = obj.x + "px";
        box.style.top = obj.y + "px";
        box.style.width = obj.width + "px";
        box.style.height = obj.height + "px";
        box.style.border = "2px solid red";
        box.style.pointerEvents = "none";
        game.appendChild(box);
    }
}
