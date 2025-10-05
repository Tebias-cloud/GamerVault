// ELEMENTOS DEL DOM
const chatIcon = document.getElementById("chatbotIcon");
const chatWindow = document.getElementById("chatbotWindow");
const closeChat = document.getElementById("closeChat");
const chatBody = chatWindow.querySelector(".chat-body");
const chatInput = chatWindow.querySelector(".chat-input input");
const chatButton = chatWindow.querySelector(".chat-input button");

// ABRIR Y CERRAR CHATBOT
chatIcon.addEventListener("click", () => {
  chatWindow.style.display = "flex";
  chatInput.focus();
});

closeChat.addEventListener("click", () => {
  chatWindow.style.display = "none";
});

// FUNCION PARA AÑADIR MENSAJES AL CHAT
function addMessage(message, sender = "bot") {
  const div = document.createElement("div");
  div.classList.add(sender === "bot" ? "bot-message" : "user-message");
  div.textContent = message;
  chatBody.appendChild(div);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// RESPUESTAS SIMULADAS DE LA IA
function getBotResponse(input) {
  input = input.toLowerCase();

  if (input.includes("hola") || input.includes("hi")) {
    return "👋 ¡Hola! ¿Qué tipo de juegos te gustan? Acción, RPG, Estrategia…";
  }
  if (input.includes("acción")) {
    return "🎯 Te recomiendo revisar 'Call of Heroes' o 'Battle Arena'.";
  }
  if (input.includes("rpg")) {
    return "🛡️ Perfecto, en RPG destacan 'Dragon Quest' y 'Legends of Valor'.";
  }
  if (input.includes("estrategia")) {
    return "♟️ En estrategia te puede interesar 'Mind Tactics' o 'Empire Builder'.";
  }
  if (input.includes("catálogo") || input.includes("juegos")) {
    return "📂 Puedes ir a la sección de Catálogo para ver todos los juegos disponibles.";
  }
  if (input.includes("recompensas") || input.includes("logros")) {
    return "🏆 Mira tus logros y puntos en la sección Recompensas.";
  }
  if (input.includes("gracias") || input.includes("thank")) {
    return "😊 ¡De nada! Estoy aquí para ayudarte a encontrar tu próximo juego.";
  }
  return "🤖 Lo siento, no entendí eso. Puedes preguntarme sobre 'Acción', 'RPG', 'Estrategia', 'Catálogo' o 'Recompensas'.";
}

// FUNCION PARA ENVIAR MENSAJE
function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  chatInput.value = "";

  // Simular retraso de respuesta IA
  setTimeout(() => {
    const response = getBotResponse(message);
    addMessage(response, "bot");
  }, 600 + Math.random() * 800);
}

// EVENTO BOTÓN ENVIAR
chatButton.addEventListener("click", sendMessage);

// EVENTO ENTER
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// MENSAJE DE BIENVENIDA AUTOMÁTICO
window.addEventListener("load", () => {
  setTimeout(() => {
    addMessage("👋 ¡Hola! Soy tu asistente GamerVault IA. Pregúntame sobre juegos o recompensas.", "bot");
  }, 800);
});
