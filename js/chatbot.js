import { supabase, getUser } from './supabaseClient.js';
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js';

// --- 0. CONFIGURACIÓN GLOBAL Y DICCIONARIO ---
const slangMap = {
    "mc": "Minecraft", "mincraft": "Minecraft",
    "gta": "Grand Theft Auto", "gta5": "Grand Theft Auto V",
    "cod": "Call of Duty", "black ops": "Call of Duty",
    "gow": "God of War", "kratos": "God of War",
    "lol": "League of Legends", "wow": "World of Warcraft",
    "cs": "Counter Strike", "csgo": "Counter Strike", "cs2": "Counter Strike",
    "fc": "EA SPORTS FC", "fifa": "FIFA",
    "rdr": "Red Dead Redemption", "re": "Resident Evil",
    "fortnite": "Fortnite", "apex": "Apex Legends"
};

const genreMap = {
    "accion": "Acción", "acción": "Acción", "action": "Acción",
    "aventura": "Aventura", "adventure": "Aventura",
    "rpg": "RPG", "rol": "RPG",
    "shooter": "Shooter", "fps": "Shooter", "disparos": "Shooter",
    "deportes": "Deportes", "sports": "Deportes", "futbol": "Deportes",
    "carreras": "Carreras", "coches": "Carreras", "autos": "Carreras",
    "estrategia": "Estrategia", "rts": "Estrategia",
    "terror": "Terror", "miedo": "Terror", "horror": "Terror",
    "indie": "Indie", "simulacion": "Simulación", "sandbox": "Sandbox"
};

// --- 1. FUNCIÓN GLOBAL PARA BOTONES (Persistencia) ---
window.gbRun = function(action, payload) {
    if (action === 'search') processMessage(payload);
    else if (action === 'link') window.location.href = payload;
    else if (action === 'random') recommendRandom();
    else if (action === 'menu') saludoInicial(false);
    else if (action === 'clear') {
        localStorage.removeItem('gb_history');
        document.getElementById('chatBody').innerHTML = '';
        saludoInicial(false);
    }
};

// --- 2. ESTILOS VISUALES (CSS) ---
const styles = `
<style>
  @keyframes slideUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  
  .chatbot-window {
    background: rgba(11, 11, 15, 0.95); 
    border: 1px solid #333;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
    border-radius: 12px;
    overflow: hidden;
    font-family: 'Poppins', sans-serif;
    display: flex; flex-direction: column;
    width: 360px; height: 520px;
    position: fixed; bottom: 90px; right: 30px; z-index: 9999; 
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
    visibility: hidden; opacity: 0; transform: translateY(20px);
  }

  .chatbot-window.active {
    visibility: visible; opacity: 1; transform: translateY(0);
  }

  .chat-header {
    background: linear-gradient(90deg, #1a1a20, #15151a);
    padding: 15px; border-bottom: 1px solid #2a2a30;
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }

  .chat-body {
    flex: 1; overflow-y: auto; padding: 15px;
    background: radial-gradient(circle at 50% 30%, #15151a 0%, #0a0a0f 100%);
    scroll-behavior: smooth;
  }
  .chat-body::-webkit-scrollbar { width: 5px; }
  .chat-body::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }

  .bot-message, .user-message {
    padding: 10px 14px; margin-bottom: 12px; font-size: 0.9rem;
    line-height: 1.4; max-width: 88%; animation: slideUp 0.3s ease;
    word-wrap: break-word;
  }
  .bot-message {
    background: #25252b; border-left: 3px solid var(--neon); color: #ddd;
    border-radius: 4px 12px 12px 12px; align-self: flex-start;
  }
  .user-message {
    background: var(--neon); color: #000; font-weight: 600;
    border-radius: 12px 4px 12px 12px; margin-left: auto; text-align: right;
  }

  .chat-options { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; animation: slideUp 0.4s ease; }
  .chat-chip {
    background: rgba(255,255,255,0.05); border: 1px solid var(--neon); color: white;
    padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; 
    transition: 0.2s; display: flex; align-items: center; gap: 6px;
  }
  .chat-chip:hover { background: var(--neon); color: black; transform: translateY(-2px); }

  .bot-card {
    display: flex; align-items: center; gap: 10px; background: #1e1e24; 
    border: 1px solid #333; border-radius: 8px; padding: 8px; 
    margin-top: 5px; margin-bottom: 10px; cursor: pointer; transition: 0.2s;
    animation: slideUp 0.3s ease; text-decoration: none; position: relative;
  }
  .bot-card:hover { border-color: var(--secondary); background: #25252a; }
  .bot-card img { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; }
  .bot-card-content { flex: 1; min-width: 0; }
  .bot-card h5 { margin: 0; font-size: 0.85rem; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bot-card span { font-size: 0.75rem; color: var(--secondary); font-weight: bold; }
  
  .chat-input { padding: 12px; background: #15151a; border-top: 1px solid #333; display: flex; gap: 8px; flex-shrink: 0; }
  .chat-input input { 
    flex: 1; background: #0a0a0f; border: 1px solid #333; color: white; 
    padding: 10px; border-radius: 6px; outline: none; transition: 0.3s; 
  }
  .chat-input input:focus { border-color: var(--neon); }
  #sendBtn { 
    width: 40px; height: 40px; background: var(--neon); border: none; 
    border-radius: 6px; color: black; cursor: pointer; transition: 0.2s; 
    display: flex; align-items: center; justify-content: center;
  }
  #sendBtn:hover { transform: scale(1.05); filter: brightness(1.2); }

  .typing-indicator { font-size: 0.75rem; color: var(--secondary); margin-left: 15px; margin-bottom: 5px; display: none; }
  
  .chatbot-icon {
    position: fixed; bottom: 30px; right: 30px; width: 55px; height: 55px;
    background: var(--neon); border-radius: 50%; display: flex; 
    align-items: center; justify-content: center; font-size: 1.8rem; 
    color: white; cursor: pointer; z-index: 9998; 
    box-shadow: 0 0 20px var(--neon); transition: 0.3s;
  }
  .chatbot-icon:hover { transform: scale(1.1) rotate(10deg); }
</style>
`;
document.head.insertAdjacentHTML('beforeend', styles);

// --- 3. HTML ESTRUCTURAL ---
const chatHTML = `
  <div class="chatbot-icon" id="chatbotIcon">
    <i class="fas fa-robot"></i>
    <div style="position:absolute; top:-2px; right:-2px; width:12px; height:12px; background:#00ff88; border-radius:50%; border:2px solid #000;"></div>
  </div>
  
  <div class="chatbot-window" id="chatbotWindow">
    <div class="chat-header">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:32px; height:32px; background:linear-gradient(135deg, var(--neon), #4a00e0); border-radius:6px; display:flex; align-items:center; justify-content:center;">
            <i class="fas fa-headset" style="color:white; font-size:0.9rem;"></i>
        </div>
        <div>
            <h4 style="margin:0; font-family:'Orbitron'; font-size:0.9rem; color:white;">GamerBot AI</h4>
            <span style="font-size:0.65rem; color:#aaa;">En línea</span>
        </div>
      </div>
      <div style="display:flex; gap:12px;">
        <i class="fas fa-eraser" onclick="window.gbRun('clear')" title="Limpiar" style="cursor:pointer; color:#666; font-size:0.9rem;"></i>
        <i class="fas fa-times" id="closeChat" style="cursor:pointer; color:#fff; font-size:1.1rem;"></i>
      </div>
    </div>
    
    <div class="chat-body" id="chatBody"></div>
    <div class="typing-indicator" id="typingIndicator"><i class="fas fa-circle-notch fa-spin"></i> Escribiendo...</div>

    <div class="chat-input">
      <input type="text" id="chatInput" placeholder="Escribe aquí..." autocomplete="off">
      <button id="sendBtn"><i class="fas fa-paper-plane"></i></button>
    </div>
  </div>
`;

if (!document.getElementById('chatbotIcon')) {
    document.body.insertAdjacentHTML('beforeend', chatHTML);
}

// --- 4. REFERENCIAS Y ESTADO ---
const chat = {
    icon: document.getElementById('chatbotIcon'),
    win: document.getElementById('chatbotWindow'),
    close: document.getElementById('closeChat'),
    in: document.getElementById('chatInput'),
    body: document.getElementById('chatBody'),
    type: document.getElementById('typingIndicator'),
    btn: document.getElementById('sendBtn')
};

let fuse; 
let allGames = [];
let isInitialized = false;
let currentUserProfile = null;

const clickSound = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=pop-39222.mp3");
clickSound.volume = 0.15;

// --- 5. CARGA INTELIGENTE ---
async function initSmartBot() {
    const wasOpen = localStorage.getItem('gb_isOpen') === 'true';
    if (wasOpen) {
        chat.win.classList.add('active');
        chat.icon.style.display = 'none';
        
        chat.body.style.scrollBehavior = 'auto';
        chat.body.innerHTML = localStorage.getItem('gb_history') || '';
        chat.body.scrollTop = chat.body.scrollHeight;
        setTimeout(() => chat.body.style.scrollBehavior = 'smooth', 100);
    }

    if (isInitialized) return;

    try {
        const user = await getUser();
        if(user) {
            const { data } = await supabase.from('perfiles').select('username').eq('id', user.id).single();
            currentUserProfile = data ? data.username : user.email.split('@')[0];
        }

        // CORRECCIÓN: Traemos todos los juegos disponibles para tener variedad real
        const { data, error } = await supabase.from('juegos').select('id, titulo, genero, precio, imagen_url, keywords');
        
        if (!error && data) {
            allGames = data; // Guardamos TODO el catálogo en memoria
            const options = { includeScore: true, threshold: 0.35, keys: ['titulo', 'genero', 'keywords'] };
            fuse = new Fuse(allGames, options);
            isInitialized = true;
        }
    } catch (e) { console.error(e); }
}

// --- EVENTOS UI ---
chat.icon.onclick = () => {
    chat.win.classList.add('active');
    chat.icon.style.display = 'none';
    chat.in.focus();
    localStorage.setItem('gb_isOpen', 'true');
    initSmartBot().then(() => { if(chat.body.innerHTML.trim() === "") saludoInicial(); });
};

chat.close.onclick = () => {
    chat.win.classList.remove('active');
    setTimeout(() => {
        chat.icon.style.display = 'flex';
        chat.body.innerHTML = '';
        localStorage.removeItem('gb_history');
        localStorage.setItem('gb_isOpen', 'false');
    }, 300);
};

// --- 6. MOTOR DE RESPUESTA ---
async function processMessage(overrideText = null) {
    const rawText = overrideText || chat.in.value.trim();
    if (!rawText) return;

    if (!overrideText) { addMsg(rawText, 'user'); chat.in.value = ''; } 
    else { addMsg(rawText, 'user'); }
    
    playSound(); showTyping(true); await wait(500); 
    const lower = rawText.toLowerCase();

    // 1. Jerga
    let searchText = rawText;
    Object.keys(slangMap).forEach(key => {
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        if (regex.test(lower) || lower === key) searchText = slangMap[key];
    });

    // 2. Género
    let searchGenre = null;
    Object.keys(genreMap).forEach(key => {
        if (lower.includes(key)) searchGenre = genreMap[key];
    });

    // 3. Intenciones
    if (['hola', 'inicio', 'menu'].some(w => lower.includes(w))) { showTyping(false); saludoInicial(false); return; }
    
    if (lower.includes('barato') || lower.includes('oferta')) { await buscarBaratos(); return; }
    if (lower.includes('gratis') || lower.includes('free')) { await buscarGratis(); return; }

    // INTENCIONES DE NAVEGACIÓN (NUEVO)
    if (['biblioteca', 'mis juegos', 'comprados'].some(w => lower.includes(w))) {
        showTyping(false);
        addMsg("📚 Accede a tu colección aquí:", 'bot');
        addChips([{ t: 'Mi Biblioteca', a: 'link', p: 'perfil.html#library', i: 'fas fa-book' }]);
        mostrarOpcionesGenerales();
        saveHistory();
        return;
    }

    if (lower.includes('puntos') || lower.includes('saldo')) {
        showTyping(false);
        addMsg("💎 <b>Sistema de Puntos:</b><br>Gana puntos comprando y canjéalos por premios.", 'bot');
        addChips([ { t: 'Ver Mercado', a: 'link', p: 'recompensas.html', i: 'fas fa-store' } ]);
        return;
    }
    if (lower.includes('recomienda')) { await recommendRandom(); return; }

    // 4. Búsqueda
    await buscarJuego(searchText, searchGenre);
}

// --- FUNCIONES DE BÚSQUEDA ---

async function buscarBaratos() {
    const { data } = await supabase.from('juegos').select('*').gt('precio', 0).lt('precio', 20).order('precio', { ascending: true }).limit(3);
    showTyping(false);
    if(data && data.length > 0) {
        addMsg("💸 Ofertas destacadas (< $20):", 'bot');
        data.forEach(j => agregarTarjetaJuego(j));
    } else {
        addMsg("No encontré ofertas específicas hoy.", 'bot');
    }
    mostrarOpcionesGenerales();
    saveHistory();
}

async function buscarGratis() {
    const { data } = await supabase.from('juegos').select('*').eq('precio', 0).limit(3);
    showTyping(false);
    if(data && data.length > 0) {
        addMsg("🤑 ¡Son GRATIS!", 'bot');
        data.forEach(j => agregarTarjetaJuego(j));
    } else {
        addMsg("No hay juegos gratis en este momento.", 'bot');
    }
    mostrarOpcionesGenerales();
    saveHistory();
}

async function buscarJuego(query, genreFilter = null) {
    let encontrados = [];

    if (genreFilter) {
        const { data } = await supabase.from('juegos').select('*').ilike('genero', `%${genreFilter}%`).limit(3);
        if (data && data.length > 0) {
            encontrados = data;
            addMsg(`📂 Top juegos de <b>${genreFilter}</b>:`, 'bot');
        }
    } else {
        if (isInitialized && fuse) {
            const results = fuse.search(query);
            if (results.length > 0) encontrados = results.slice(0, 3).map(r => r.item);
        }
        if (encontrados.length === 0) {
            const { data } = await supabase.from('juegos').select('*').ilike('titulo', `%${query}%`).limit(3);
            if (data && data.length > 0) encontrados = data;
        }
    }

    showTyping(false);

    if (encontrados.length > 0) {
        if (!genreFilter) addMsg(`🎯 Encontrado:`, 'bot');
        encontrados.forEach(juego => agregarTarjetaJuego(juego));
    } else {
        addMsg(`😅 No encontré "<b>${query}</b>".`, 'bot');
    }
    
    mostrarOpcionesGenerales(); 
    saveHistory();
}

async function recommendRandom() {
    // Si la memoria está vacía, intentamos cargarla
    if (allGames.length === 0) { 
        const { data } = await supabase.from('juegos').select('*'); 
        if(data) allGames = data;
    }
    
    showTyping(false);
    
    if(allGames.length > 0) {
        // ALGORITMO DE BARAJADO REAL (Fisher-Yates Shuffle)
        // Esto garantiza que no se repitan siempre los mismos
        const shuffled = [...allGames];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        // Tomamos los 2 primeros después de barajar
        const randoms = shuffled.slice(0, 2);
        addMsg("🔥 Mira estas joyas ocultas:", 'bot');
        randoms.forEach(j => agregarTarjetaJuego(j));
    } else {
        addMsg("Conectando con el servidor...", 'bot');
    }
    mostrarOpcionesGenerales();
    saveHistory();
}

// --- 7. UI BUILDERS ---

// Esta función mantiene el chat vivo y útil
function mostrarOpcionesGenerales() {
    addChips([
        { t: '🔍 Buscar', a: 'search', p: '', i: 'fas fa-search' },
        { t: '🎲 Otra', a: 'random', p: '', i: 'fas fa-dice' },
        { t: '📚 Biblio', a: 'link', p: 'perfil.html#library', i: 'fas fa-book' }, // Nuevo
        { t: '🏠 Menú', a: 'menu', p: '', i: 'fas fa-bars' }
    ]);
}

function saludoInicial(primeraVez = true) {
    const nombre = currentUserProfile ? ` <b>${currentUserProfile}</b>` : '';
    const msg = primeraVez ? `👋 ¡Hola${nombre}! Soy GamerBot.` : "🤖 Menú Principal:";
    addMsg(msg, 'bot');
    
    // MENÚ INICIAL MÁS COMPLETO
    addChips([
        { t: 'Ofertas', a: 'search', p: 'barato', i: 'fas fa-tag' },
        { t: 'Recomendar', a: 'random', p: '', i: 'fas fa-star' },
        { t: '💎 Puntos', a: 'search', p: 'puntos', i: 'fas fa-gem' },
        { t: '📚 Biblioteca', a: 'link', p: 'perfil.html#library', i: 'fas fa-book' },
        { t: '❤️ Deseados', a: 'link', p: 'perfil.html#wishlist', i: 'fas fa-heart' }
    ]);
    saveHistory();
}

function agregarTarjetaJuego(juego) {
    const precio = juego.precio === 0 ? 'GRATIS' : `$${juego.precio}`;
    const link = `catalogo.html?buscar=${encodeURIComponent(juego.titulo)}`;
    const html = `
        <div class="bot-card" onclick="window.location.href='${link}'">
            <img src="${juego.imagen_url}" alt="img" onerror="this.src='https://placehold.co/60x60?text=GAME'">
            <div class="bot-card-content"><h5>${juego.titulo}</h5><span>${precio}</span></div>
            <i class="fas fa-chevron-right"></i>
        </div>`;
    const div = document.createElement('div'); div.innerHTML = html;
    chat.body.appendChild(div.firstElementChild); playSound(); scrollToBottom(); 
}

function addMsg(html, type) {
    const div = document.createElement('div'); div.className = type === 'user' ? 'user-message' : 'bot-message';
    div.innerHTML = html; chat.body.appendChild(div); scrollToBottom(); 
}
function addChips(options) {
    const div = document.createElement('div'); div.className = 'chat-options';
    options.forEach(opt => {
        let onclickAction = `window.gbRun('${opt.a}', '${opt.p}')`;
        if (opt.a === 'search' && opt.p === '') onclickAction = "document.getElementById('chatInput').focus();"; 
        div.insertAdjacentHTML('beforeend', `<button class="chat-chip" onclick="${onclickAction}"><i class="${opt.i}"></i> ${opt.t}</button>`);
    });
    chat.body.appendChild(div); scrollToBottom(); 
}

// --- UTILS ---
function showTyping(show) { chat.type.style.display = show ? 'block' : 'none'; if(show) scrollToBottom(); }
function scrollToBottom() { chat.body.scrollTop = chat.body.scrollHeight; }
function saveHistory() { localStorage.setItem('gb_history', chat.body.innerHTML); }
function playSound() { clickSound.currentTime = 0; clickSound.play().catch(e=>{}); }
const wait = (ms) => new Promise(r => setTimeout(r, ms));

chat.btn.onclick = () => processMessage();
chat.in.addEventListener('keypress', (e) => { if (e.key === 'Enter') processMessage(); });
initSmartBot();