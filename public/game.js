// ==========================================
// 🎮 CONEXIÓN
// ==========================================
const socket = io();
const username = prompt("Ingresa tu nombre:") || "Invitado";


// ==========================================
// 📍 SPAWN FIJO POR SALA
// ==========================================
const spawnPoints = {
  plaza: { x: 375, y: 225 },
  cafe: { x: 200, y: 400 }
};

let currentRoom = "plaza";
let currentDirection = "down";
let myPosition = { ...spawnPoints[currentRoom] };

const game = document.getElementById("game");
const mensajes = document.getElementById("mensajes");
const texto = document.getElementById("texto");

game.classList.add(currentRoom);

// ==========================================
// 🎵 MÚSICA
// ==========================================
const botonMusica = document.getElementById("botonMusica");
const musicaFondo = document.getElementById("musicaFondo");
let musicaActiva = false;

botonMusica.addEventListener("click", () => {

  if (!musicaActiva) {
    musicaFondo.volume = 0.5;
    musicaFondo.play();
    botonMusica.textContent = "🔇 Apagar Música";
    musicaActiva = true;
  } else {
    musicaFondo.pause();
    botonMusica.textContent = "🔊 Música";
    musicaActiva = false;
  }

});


// ==========================================
// 🎯 MINI JUEGO
// ==========================================
let jugando = false;

const miniJuego = document.createElement("div");
miniJuego.className = "mini-juego hidden";
miniJuego.innerHTML = `
  <h3>🎯 Adivina el número (1 - 20)</h3>
  <input type="number" id="guessInput" min="1" max="20">
  <button id="guessBtn">Intentar</button>
  <p id="resultadoJuego"></p>
  <button id="cerrarBtn">Cerrar</button>
`;
document.body.appendChild(miniJuego);


// 🔘 BOTÓN SOLO EN EL CAFÉ
const botonMiniJuego = document.createElement("button");
botonMiniJuego.textContent = "🎯 Jugar";
botonMiniJuego.className = "boton-juego hidden";
document.body.appendChild(botonMiniJuego);


// ==========================================
// FUNCIONES MINI JUEGO
// ==========================================
function abrirJuego() {
  if (currentRoom !== "cafe") {
    alert("☕ Solo puedes jugar dentro del café");
    return;
  }
  miniJuego.classList.remove("hidden");
  jugando = true;
}

function cerrarJuego() {
  miniJuego.classList.add("hidden");
  jugando = false;
}

botonMiniJuego.addEventListener("click", abrirJuego);

document.addEventListener("click", (e) => {

  if (e.target.id === "guessBtn") {
    const numero = document.getElementById("guessInput").value;
    if (!numero) return;

    socket.emit("guessNumber", {
      numero,
      username
    });

    document.getElementById("guessInput").value = "";
  }

  if (e.target.id === "cerrarBtn") {
    cerrarJuego();
  }
});

socket.on("gameMessage", (data) => {
  document.getElementById("resultadoJuego").textContent = data.mensaje;
});


// ==========================================
// 🧱 COLISIONES
// ==========================================
const mapasColisiones = {
  plaza: [
    { x: 350, y: 0, width: 500, height: 120 },
    { x: 900, y: 0, width: 1000, height: 525 },
    { x: 0, y: 0, width: 100, height: 600 }
  ],
  cafe: [
    { x: 300, y: 115, width: 180, height: 180 },
    { x: 0, y: 0, width: 100, height: 600 },
    { x: 850, y: 0, width: 650, height: 900 }
  ]
};

function colisionRect(player, wall) {
  return (
    player.x < wall.x + wall.width &&
    player.x + 45 > wall.x &&
    player.y < wall.y + wall.height &&
    player.y + 45 > wall.y
  );
}


// ==========================================
// 👤 JUGADOR PRINCIPAL
// ==========================================
const myDiv = document.createElement("div");
myDiv.className = "player";
game.appendChild(myDiv);

function getSpritePath(direction) {
  switch(direction) {
    case "up": return "personaje/arriba.png";
    case "down": return "personaje/frente.png";
    case "left": return "personaje/izquierda.png";
    case "right": return "personaje/derecha.png";
    default: return "personaje/frente.png";
  }
}

function updateVisual() {
  myDiv.style.left = myPosition.x + "px";
  myDiv.style.top = myPosition.y + "px";
  myDiv.style.backgroundImage =
    `url("${getSpritePath(currentDirection)}")`;
}

updateVisual();


// ==========================================
// 📡 ENTRAR AL SERVIDOR
// ==========================================
socket.emit("joinGame", {
  username,
  x: myPosition.x,
  y: myPosition.y,
  room: currentRoom,
  direction: currentDirection
});


// ==========================================
// 👥 MULTIJUGADOR
// ==========================================
const otherPlayersDivs = {};

socket.on("playersUpdate", (players) => {

  for (const id in players) {

    if (id === socket.id) continue;

    const p = players[id];
    let div = otherPlayersDivs[id];

    if (!div) {
      div = document.createElement("div");
      div.className = "player";
      otherPlayersDivs[id] = div;
      game.appendChild(div);
    }

    div.style.left = p.x + "px";
    div.style.top = p.y + "px";
    div.style.backgroundImage =
      `url("${getSpritePath(p.direction || "down")}")`;
  }

  for (const id in otherPlayersDivs) {
    if (!players[id]) {
      game.removeChild(otherPlayersDivs[id]);
      delete otherPlayersDivs[id];
    }
  }
});


// ==========================================
// 🎮 MOVIMIENTO
// ==========================================
document.addEventListener("keydown", (e) => {

  if (jugando) return;

  const speed = 10;
  let newX = myPosition.x;
  let newY = myPosition.y;

  if (e.key === "ArrowUp") { newY -= speed; currentDirection = "up"; }
  if (e.key === "ArrowDown") { newY += speed; currentDirection = "down"; }
  if (e.key === "ArrowLeft") { newX -= speed; currentDirection = "left"; }
  if (e.key === "ArrowRight") { newX += speed; currentDirection = "right"; }

  newX = Math.max(0, Math.min(1030 - 45, newX));
  newY = Math.max(0, Math.min(530 - 45, newY));

  const futurePlayer = { x: newX, y: newY };
  let blocked = false;

  const colisiones = mapasColisiones[currentRoom] || [];

  for (let wall of colisiones) {
    if (colisionRect(futurePlayer, wall)) {
      blocked = true;
      break;
    }
  }

  if (!blocked) {
    myPosition.x = newX;
    myPosition.y = newY;

    updateVisual();

    socket.emit("move", {
      x: newX,
      y: newY,
      direction: currentDirection
    });
  }
});


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
  if (!texto.value.trim()) return;
  socket.emit("mensaje", texto.value);
  texto.value = "";
}

texto.addEventListener("keydown", (e) => {
  if (e.key === "Enter") enviar();
});


// ==========================================
// 🚪 CAMBIO DE SALA
// ==========================================
function changeRoom(newRoom) {

  socket.emit("changeRoom", newRoom);

  game.classList.remove(currentRoom);
  game.classList.add(newRoom);
  currentRoom = newRoom;

  myPosition = { ...spawnPoints[newRoom] };
  updateVisual();

  // Mostrar botón solo en el café
  if (newRoom === "cafe") {
    botonMiniJuego.classList.remove("hidden");
  } else {
    botonMiniJuego.classList.add("hidden");
    cerrarJuego();
  }
}
