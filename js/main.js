// --- CONFIGURACIÓN DEL CHAT ---
// (Asegúrate de que estos IDs coincidan con tu HTML)
const chatInput = document.getElementById('chat-input'); // El <input> donde escribe el usuario
const sendButton = document.getElementById('send-button'); // El botón de enviar
const chatWindow = document.getElementById('chat-window'); // El <div> que contiene los mensajes

// Esta es la URL de tu "cerebro".
// Apunta al servidor que está corriendo en tu terminal.
const API_URL = 'https://gamevault-backend-hyin.onrender.com/api/chat';

// --- LÓGICA DE EVENTOS ---
sendButton.addEventListener('click', enviarMensaje);
chatInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    enviarMensaje();
  }
});

// --- FUNCIÓN PRINCIPAL ---
async function enviarMensaje() {
  const mensaje = chatInput.value.trim();
  if (!mensaje) return; // No enviar mensajes vacíos

  // 1. Muestra el mensaje del usuario en la ventana
  mostrarMensaje(mensaje, 'usuario');
  chatInput.value = ''; // Limpia el input

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

    // 3. Recibe la respuesta del servidor
    const data = await response.json();
    const respuestaIA = data.respuesta;

    // 4. Borra el "escribiendo..." y muestra la respuesta real de la IA
    document.querySelector('.bot-loading').remove(); // Borra el mensaje de carga
    mostrarMensaje(respuestaIA, 'bot'); // Muestra la respuesta de la IA

  } catch (error) {
    console.error('Error:', error);
    // Si falla, quita el "escribiendo..." y muestra un error
    document.querySelector('.bot-loading').remove();
    mostrarMensaje('Error de conexión. Asegúrate de que el servidor esté corriendo.', 'bot-error');
  }
}

// --- FUNCIÓN AUXILIAR ---
// (Esta es una función de ejemplo, adáptala a tu HTML/CSS)
function mostrarMensaje(mensaje, tipo) {
  // 'tipo' será 'usuario', 'bot', 'bot-loading' o 'bot-error'
  // Puedes usar esto para darle estilos CSS diferentes

  const messageElement = document.createElement('div');
  messageElement.classList.add('chat-message', tipo); // Añade clases para CSS
  messageElement.textContent = mensaje;
  
  chatWindow.appendChild(messageElement);
  
  // Auto-scroll al final
  chatWindow.scrollTop = chatWindow.scrollHeight;
}


