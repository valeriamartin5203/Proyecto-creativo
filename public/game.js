// conectamos a los jugadores usando a socket.io
const socket = io();

//de pedimos al usuario que agrege un nombre para su usuario
const usermane = prompt("Ingresa tu nombre de usuario:");

//enviamos el nombre al servidor para que lo guarde
socket.emit("joinGame", usermane);

// obtenemos el elemento del juego
const game=document.getElementById("game");

// guardamos los datos del jugador
const playerselements= {};

// la posicion de tendra el jugador
let myposition = {x: 100, y: 100};

// escuchamos los datos de los jugadores
socket.on("playersUpdate", (players) => {
    game.innerHTML = ""; // Limpiamos el juego antes de dibujar
    for (const id in players) {
        const player = players[id];
       
        const playerElement = document.createElement("div");
        jugador.className = "player";
        jugador.style.left = player.x + "px";
        jugador.style.top = player.y + "px";
        jugador.innerText = player.name;

        game.appendChild(jugador);
    }
});

// en este apartado ponermos el movimiento del jugador
document.addEventListener("keydown", (e) => {
    const speed = 10; // Velocidad de movimiento
    if (e.key === "ArrowUp") myposition.y -= Speed;
    if (e.key === "ArrowDown") myposition.y += Speed;
    if (e.key === "ArrowLeft") myposition.x -= Speed;
    if (e.key === "ArrowRight") myposition.x += Speed;

    // Enviamos la nueva posición al servidor
    socket.emit("move", myposition);
});


//cambiar de sala 
function changeRoom(newRoom) {
    socket.emit("changeRoom", newRoom);

    myposition = {x: 100, y: 100}; // Reiniciamos la posición al cambiar de sala
}
