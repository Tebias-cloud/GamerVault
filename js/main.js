// --- CONFIGURACIÓN DEL CHAT ---
// URLs (¡Correcto!)
// LÍNEA NUEVA Y CORRECTA (Vercel):
const API_URL = 'https://gamevault-backend-cag8.vercel.app/api/chat';
// Selectores para ABRIR y CERRAR el chat
const chatIcon = document.getElementById('chatbotIcon');
const chatPopup = document.getElementById('chatbotWindow'); // La ventana emergente
const closeButton = document.getElementById('closeChat');

// Selectores para ENVIAR mensajes (¡CORREGIDOS!)
const chatInput = document.getElementById('chatInput'); // Corregido
const sendButton = document.getElementById('sendBtn');   // Corregido
const chatWindow = document.getElementById('chatBody'); // Corregido (es 'chatBody')

// --- LÓGICA DE ABRIR Y CERRAR ---
chatIcon.addEventListener('click', () => {
  chatPopup.style.display = 'flex'; 
});

closeButton.addEventListener('click', () => {
  chatPopup.style.display = 'none';
});

// --- LÓGICA DE EVENTOS (Enviar mensaje) ---
sendButton.addEventListener('click', enviarMensaje);
chatInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    enviarMensaje();
  }
});

// --- FUNCIÓN PRINCIPAL ---
async function enviarMensaje() {
  const mensaje = chatInput.value.trim();
  if (!mensaje) return; 

  // 1. Muestra el mensaje del usuario en la ventana
  mostrarMensaje(mensaje, 'usuario');
  chatInput.value = ''; 

  try {
    // Muestra un indicador de "escribiendo..." mientras espera
    mostrarMensaje('Escribiendo...', 'bot-loading');

    // 2. Llama a tu servidor Back-End
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mensaje: mensaje }), // Envía el mensaje del usuario
    });

    const data = await response.json();
    const respuestaIA = data.respuesta;

    // 4. Borra el "escribiendo..." y muestra la respuesta real de la IA
    document.querySelector('.bot-loading').remove(); 
    mostrarMensaje(respuestaIA, 'bot'); 

  } catch (error) {
    console.error('Error:', error);
    // Si falla, quita el "escribiendo..." y muestra un error
    if (document.querySelector('.bot-loading')) {
      document.querySelector('.bot-loading').remove();
    }
    mostrarMensaje('Error de conexión o servidor. Intenta de nuevo.', 'bot-error');
  }
}

// --- FUNCIÓN AUXILIAR ---
function mostrarMensaje(mensaje, tipo) {
  const messageElement = document.createElement('div');
  
  if (tipo === 'bot') {
    messageElement.classList.add('bot-message');
  } else {
    messageElement.classList.add(tipo + '-message');
  }
  
  messageElement.textContent = mensaje;
  
  chatWindow.appendChild(messageElement);
  
  // Auto-scroll al final
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- FUNCIÓN AUXILIAR (Sin cambios, ya estaba bien) ---
function mostrarMensaje(mensaje, tipo) {
  // 'tipo' será 'usuario', 'bot', 'bot-loading' o 'bot-error'
  // Puedes usar esto para darle estilos CSS diferentes

  const messageElement = document.createElement('div');
  // Ajuste: tu HTML usa 'bot-message' para el primer mensaje, usemos ese estándar
  if (tipo === 'bot') {
    messageElement.classList.add('bot-message');
  } else {
    // Aquí puedes añadir clases para 'usuario', 'bot-loading', 'bot-error'
    messageElement.classList.add(tipo + '-message');
  }
  
  messageElement.textContent = mensaje;
  
  chatWindow.appendChild(messageElement);
  
  // Auto-scroll al final
  chatWindow.scrollTop = chatWindow.scrollHeight;
}