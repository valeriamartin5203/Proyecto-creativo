// Conectamos a los jugadores usando Socket.io
const socket = io();

// Pedimos al usuario que agregue un nombre
const username = prompt("Ingresa tu nombre de usuario:") || "Invitado";

// Enviamos el nombre al servidor
socket.emit("joinGame", username);

// Obtenemos el elemento del juego
const game = document.getElementById("game");

// Posición del jugador actual
let myPosition = { x: 100, y: 100 };

// Escuchamos los datos de los jugadores
socket.on("playersUpdate", (players) => {
    game.innerHTML = ""; // Limpiamos el área de juego

    for (const id in players) {
        const player = players[id];

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

// Movimiento del jugador
document.addEventListener("keydown", (e) => {
    const speed = 10;

    if (e.key === "ArrowUp") myPosition.y -= speed;
    if (e.key === "ArrowDown") myPosition.y += speed;
    if (e.key === "ArrowLeft") myPosition.x -= speed;
    if (e.key === "ArrowRight") myPosition.x += speed;

    // Límites del mapa
    myPosition.x = Math.max(0, Math.min(755, myPosition.x));
    myPosition.y = Math.max(0, Math.min(455, myPosition.y));

    // Enviamos la nueva posición al servidor
    socket.emit("move", myPosition);
});

// Cambiar de sala
function changeRoom(newRoom) {
    socket.emit("changeRoom", newRoom);
    myPosition = { x: 100, y: 100 };
}
