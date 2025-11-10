// --- CONFIGURACIÓN DEL CHAT ---
// URLs (La URL es la principal y estable de Vercel)
const API_URL = 'https://gamevault-backend-cag8.vercel.app/api/chat'; 

// Selectores para ABRIR y CERRAR el chat
const chatIcon = document.getElementById('chatbotIcon');
const chatPopup = document.getElementById('chatbotWindow'); 
const closeButton = document.getElementById('closeChat');

// Selectores para ENVIAR mensajes
const chatInput = document.getElementById('chatInput'); 
const sendButton = document.getElementById('sendBtn');   
const chatWindow = document.getElementById('chatBody'); // Contenedor de mensajes

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
        e.preventDefault(); // Evita que la página se recargue
        enviarMensaje();
    }
});

// --- FUNCIÓN PRINCIPAL ---
async function enviarMensaje() {
    const mensaje = chatInput.value.trim();
    if (!mensaje) return; 

    // Generamos un ID único para el mensaje de carga temporal (SOLUCION DEL BUG)
    const loadingId = 'loading-' + Date.now(); 
    
    // 1. Muestra el mensaje del usuario
    mostrarMensaje(mensaje, 'usuario');
    chatInput.value = ''; 

    try {
        // Muestra el indicador de carga con el ID único
        mostrarMensaje('Escribiendo...', 'bot-loading', loadingId);

        // 2. Llama a tu servidor Back-End
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mensaje: mensaje }), 
        });

        // Verificamos si la respuesta del servidor es válida (código 200-299)
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        const respuestaIA = data.respuesta || "El servidor devolvió una respuesta vacía.";

        // 3. Borra el indicador de carga (usando el ID seguro)
        document.getElementById(loadingId)?.remove();

        // 4. Muestra la respuesta real
        mostrarMensaje(respuestaIA, 'bot'); 

    } catch (error) {
        console.error('Error de conexión o parseo:', error);
        
        // Borra el indicador de carga si falló
        document.getElementById(loadingId)?.remove();
        
        // Muestra el error en la ventana del chat
        mostrarMensaje('Error de conexión o servidor. Intenta de nuevo.', 'bot-error');
    }
}

// --- FUNCIÓN AUXILIAR (ÚNICA Y CORRECTA) ---
// Esta función crea el elemento HTML y lo añade a la ventana
// Se usa un ID opcional para que la función enviarMensaje pueda borrar el mensaje de carga
function mostrarMensaje(mensaje, tipo, id = null) {
    const messageElement = document.createElement('div');
    
    if (id) {
        messageElement.id = id;
    }
    
    // Asigna las clases CSS para el estilo
    if (tipo === 'bot') {
        messageElement.classList.add('bot-message');
    } else if (tipo === 'usuario') {
        messageElement.classList.add('user-message');
    } else {
        // Para 'bot-loading' y 'bot-error'
        messageElement.classList.add('system-message', tipo);
    }
    
    messageElement.textContent = mensaje;
    
    chatWindow.appendChild(messageElement);
    // Auto-scroll al final
    chatWindow.scrollTop = chatWindow.scrollHeight;
}