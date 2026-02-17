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
// 🎯 MINI JUEGO MULTIJUGADOR
// ==========================================

let jugando = false; // bloquea movimiento

// Crear panel del mini juego
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

// Abrir juego SOLO si estás en el café
function abrirJuego() {
  if (currentRoom !== "cafe") {
    alert("☕ Solo puedes jugar dentro del café");
    return;
  }

  miniJuego.classList.remove("hidden");
  jugando = true;
}

// Cerrar juego
function cerrarJuego() {
  miniJuego.classList.add("hidden");
  jugando = false;
}

// Enviar intento al servidor
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

// Recibir mensajes del mini juego
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
  ],

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
// 👤 CREAR JUGADOR
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
// 👥 ACTUALIZACIÓN DE OTROS JUGADORES
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

  // 🔒 Bloquear movimiento si está jugando
  if (jugando) return;

  const speed = 10;
  let newX = myPosition.x;
  let newY = myPosition.y;

  if (e.key === "ArrowUp") { newY -= speed; currentDirection = "up"; }
  if (e.key === "ArrowDown") { newY += speed; currentDirection = "down"; }
  if (e.key === "ArrowLeft") { newX -= speed; currentDirection = "left"; }
  if (e.key === "ArrowRight") { newX += speed; currentDirection = "right"; }

  // 🎯 Abrir mini juego con J
  if (e.key === "j") {
    abrirJuego();
  }

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

  myPosition = { x: 375, y: 225 };

  updateVisual();
  savePlayer();
}
