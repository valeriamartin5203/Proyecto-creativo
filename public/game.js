// ==========================================
// 🎮 CONEXIÓN
// ==========================================
const socket = io();
const username = prompt("Ingresa tu nombre:") || "Invitado";

// ==========================================
// 📦 CARGAR DATOS GUARDADOS
// ==========================================
let savedData = JSON.parse(localStorage.getItem("playerData"));

let myPosition = savedData ? { x: savedData.x, y: savedData.y } : { x: 375, y: 225 };
let currentDirection = savedData ? savedData.direction : "down";
let currentRoom = savedData ? savedData.room : "plaza";

const game = document.getElementById("game");
const mensajes = document.getElementById("mensajes");
const texto = document.getElementById("texto");

game.classList.add(currentRoom);

// ==========================================
// 🧱 COLISIONES POR SALA
// ==========================================
const mapasColisiones = {
  plaza: [
    { x: 200, y: 100, width: 300, height: 50 },
    { x: 600, y: 250, width: 100, height: 200 }
  ],
  bosque: [
    { x: 100, y: 350, width: 400, height: 60 }
  ],
  castillo: [
    { x: 250, y: 150, width: 300, height: 80 }
  ]
};

let mostrarColisiones = true;

// ==========================================
// 🎨 SPRITES
// ==========================================
function getSpritePath(direction) {
  switch(direction) {
    case "up": return "personaje/arriba.png";
    case "down": return "personaje/frente.png";
    case "left": return "personaje/izquierda.png";
    case "right": return "personaje/derecha.png";
    default: return "personaje/frente.png";
  }
}

// ==========================================
// 👤 CREAR JUGADOR
// ==========================================
const myDiv = document.createElement("div");
myDiv.className = "player";
game.appendChild(myDiv);

function updateVisual() {
  myDiv.style.left = myPosition.x + "px";
  myDiv.style.top = myPosition.y + "px";
  myDiv.style.backgroundImage =
    `url("${getSpritePath(currentDirection)}")`;
}

updateVisual();

// ==========================================
// 💾 GUARDAR PROGRESO
// ==========================================
function savePlayer() {
  localStorage.setItem("playerData", JSON.stringify({
    x: myPosition.x,
    y: myPosition.y,
    room: currentRoom,
    direction: currentDirection
  }));
}

// ==========================================
// 📡 ENVIAR DATOS AL SERVIDOR
// ==========================================
socket.emit("joinGame", {
  username,
  x: myPosition.x,
  y: myPosition.y,
  room: currentRoom,
  direction: currentDirection
});

// ==========================================
// 👥 ACTUALIZACIÓN DE JUGADORES
// ==========================================
const otherPlayersDivs = {};

socket.on("playersUpdate", (players) => {

  const me = players[socket.id];
  if (me) {
    myPosition.x = me.x;
    myPosition.y = me.y;
    currentDirection = me.direction || "down";
    updateVisual();
  }

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
// 🧠 FUNCIÓN DE COLISIÓN
// ==========================================
function colisionRect(player, wall) {
  return (
    player.x < wall.x + wall.width &&
    player.x + 45 > wall.x &&
    player.y < wall.y + wall.height &&
    player.y + 45 > wall.y
  );
}

// ==========================================
// 🔍 DIBUJAR COLISIONES (DEBUG)
// ==========================================
function dibujarColisiones() {

  const viejas = document.querySelectorAll(".debug-wall");
  viejas.forEach(w => w.remove());

  if (!mostrarColisiones) return;

  const colisiones = mapasColisiones[currentRoom] || [];

  for (let wall of colisiones) {
    const debug = document.createElement("div");
    debug.className = "debug-wall";
    debug.style.position = "absolute";
    debug.style.left = wall.x + "px";
    debug.style.top = wall.y + "px";
    debug.style.width = wall.width + "px";
    debug.style.height = wall.height + "px";
    debug.style.backgroundColor = "rgba(255, 0, 0, 0.4)";
    debug.style.pointerEvents = "none";
    game.appendChild(debug);
  }
}

// ==========================================
// 🎮 MOVIMIENTO CON COLISIÓN
// ==========================================
document.addEventListener("keydown", (e) => {

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

    savePlayer();
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
  if (e.key === "Enter") {
    enviar();
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

  for (const id in otherPlayersDivs) {
    game.removeChild(otherPlayersDivs[id]);
    delete otherPlayersDivs[id];
  }

  myPosition = { x: 375, y: 225 };

  game.appendChild(myDiv);
  updateVisual();
  savePlayer();

  dibujarColisiones();
}

// ==========================================
// 🎛 ACTIVAR / DESACTIVAR COLISIONES CON C
// ==========================================
document.addEventListener("keydown", (e) => {
  if (e.key === "c") {
    mostrarColisiones = !mostrarColisiones;
    dibujarColisiones();
  }
});

// Dibujar colisiones al iniciar
dibujarColisiones();
