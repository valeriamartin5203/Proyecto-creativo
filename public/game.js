// ================================
// CONEXIÓN
// ================================
const socket = io();

// Nombre del jugador
const username = prompt("Ingresa tu nombre de usuario:") || "Invitado";

// Enviamos el nombre al servidor
socket.emit("joinGame", username);

// ================================
// ELEMENTOS DEL DOM
// ================================
const game = document.getElementById("game");
const mensajes = document.getElementById("mensajes");
const texto = document.getElementById("texto");
const chatBtn = document.getElementById("chatBtn");
const chatContainer = document.getElementById("chatContainer");

// ================================
// ESTADO DEL JUGADOR
// ================================
let myPosition = { x: 100, y: 100 };
let currentRoom = "plaza";

// Fondo inicial
game.classList.add("plaza");

// ================================
// ACTUALIZACIÓN DE JUGADORES
// ================================
socket.on("playersUpdate", (players) => {
    game.innerHTML = "";

    for (const id in players) {
        const player = players[id];

        // Solo dibujar jugadores de la misma sala
        if (player.room !== currentRoom) continue;

        const playerElement = document.createElement("div");
        playerElement.className = "player";

        playerElement.style.left = player.x + "px";
        playerElement.style.top = player.y + "px";

        // Nombre del jugador
        const name = document.createElement("span");
        name.textContent = player.name;

        playerElement.appendChild(name);
        game.appendChild(playerElement);
    }
});

// ================================
// MOVIMIENTO
// ================================
document.addEventListener("keydown", (e) => {
    const speed = 10;

    if (e.key === "ArrowUp") myPosition.y -= speed;
    if (e.key === "ArrowDown") myPosition.y += speed;
    if (e.key === "ArrowLeft") myPosition.x -= speed;
    if (e.key === "ArrowRight") myPosition.x += speed;

    // Límites del mapa
    myPosition.x = Math.max(0, Math.min(755, myPosition.x));
    myPosition.y = Math.max(0, Math.min(455, myPosition.y));

    socket.emit("move", myPosition);
});

// ================================
// CAMBIO DE SALA
// ================================
function changeRoom(newRoom) {
    socket.emit("changeRoom", newRoom);

    // Cambiar fondo
    game.classList.remove(currentRoom);
    game.classList.add(newRoom);
    currentRoom = newRoom;

    // Limpiar pantalla
    game.innerHTML = "";

    // Reiniciar posición
    myPosition = { x: 100, y: 100 };
}

// ================================
// CHAT
// ================================

socket.on("mensaje", (data) => {
    const p = document.createElement("p");
    p.textContent = `${data.usuario}: ${data.texto}`;
    mensajes.appendChild(p);
    mensajes.scrollTop = mensajes.scrollHeight;
});

function enviar() {
    const texto = document.getElementById("texto").value;
    if (texto.trim() === "") return;

    socket.emit("mensaje", texto);
    document.getElementById("texto").value = "";
}
