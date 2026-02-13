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

// Enviar posición inicial
socket.emit("move", myPosition);

// Fondo inicial
game.classList.add("plaza");



// ==========================================
// 🧱 OBJETOS Y COLISIONES POR SALA
// Cada objeto tiene su propia caja de colisión
// ==========================================
const roomObjects = {

    plaza: [
        {
            name: "fuente",
        },
        {
            name: "arbol",
        }
    ],

    caferia: [
        {
            name: "mesa",
        }
    ]
};



// ==========================================
// 🚧 FUNCIÓN DE COLISIÓN
// Detecta si el jugador toca un objeto
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
        ) {
            return true; // Hay colisión
        }
    }

    return false; // No hay colisión
}



// ==========================================
// 👥 ACTUALIZACIÓN DE JUGADORES
// Dibuja todos los jugadores en pantalla
// ==========================================
socket.on("playersUpdate", (players) => {

    // Limpiar pantalla
    game.innerHTML = "";

    for (const id in players) {

        const player = players[id];

        // Solo mostrar jugadores de la misma sala
        if (player.room !== currentRoom) continue;

        const playerElement = document.createElement("div");
        playerElement.className = "player";
        playerElement.id = id;

        playerElement.style.left = player.x + "px";
        playerElement.style.top = player.y + "px";

        // Nombre arriba del jugador
        const name = document.createElement("span");
        name.textContent = player.name;

        playerElement.appendChild(name);
        game.appendChild(playerElement);
    }

    // 🔥 Dibujar colisiones (modo debug)
    drawCollisions();
});



// ==========================================
// 🎯 MOVIMIENTO DEL JUGADOR
// ==========================================
document.addEventListener("keydown", (e) => {

    const speed = 10;

    let newX = myPosition.x;
    let newY = myPosition.y;

    if (e.key === "ArrowUp") newY -= speed;
    if (e.key === "ArrowDown") newY += speed;
    if (e.key === "ArrowLeft") newX -= speed;
    if (e.key === "ArrowRight") newX += speed;

    // Límites del mapa
    newX = Math.max(0, Math.min(755, newX));
    newY = Math.max(0, Math.min(455, newY));

    // Verificar colisión
    if (!isColliding(newX, newY)) {

        myPosition.x = newX;
        myPosition.y = newY;

        socket.emit("move", myPosition);

        const myPlayer = document.getElementById(socket.id);
        if (myPlayer) {
            myPlayer.classList.add("walking");
        }
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

    socket.emit("move", myPosition);
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
// (Solo para ver las cajas, puedes borrarlo luego)
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
