import { supabase, getUser } from './supabaseClient.js';

let currentUserID = null;
let selectedAvatarSeed = 'default';
let currentUsername = ""; 
let isPdfGenerating = false; 

// --- DICCIONARIO DE RESPALDO (MANUAL GAME DATA) ---
const manualGameData = {
    "Grand Theft Auto V": {
        img: "https://image.api.playstation.com/vulcan/ap/rnd/202101/2019/M0tQ0AG3ekR9i9r1t6Y5c5aH.png",
        desc: "Un joven estafador callejero, un ladrón de bancos retirado y un psicópata aterrador.",
        cat: "Acción", date: "17/09/2013"
    },
    "Grand Theft Auto IV": {
        img: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/12210/header.jpg",
        desc: "El sueño americano de Niko Bellic.",
        cat: "Acción", date: "29/04/2008"
    },
    "Call of Duty: Black Ops 3": {
        img: "https://image.api.playstation.com/vulcan/img/rnd/202010/2716/1xJ8XB3bi888QTLZYdl7Oi0s.png",
        desc: "Un futuro oscuro donde nace una nueva raza de soldados Black Ops.",
        cat: "Shooter", date: "06/11/2015"
    },
    "God of War Ragnarök": {
        img: "https://image.api.playstation.com/vulcan/ap/rnd/202207/1210/4xJ8XB3bi888QTLZYdl7Oi0s.png",
        desc: "Kratos y Atreus deben viajar a cada uno de los nueve reinos.",
        cat: "Aventura", date: "09/11/2022"
    },
    "Minecraft": {
        img: "https://image.api.playstation.com/vulcan/img/rnd/202110/2019/S4frD8YX7a2v7a6c9c5aH.png",
        desc: "Coloca bloques y vive aventuras infinitas.",
        cat: "Sandbox", date: "18/11/2011"
    },
    "FIFA 24 (FC 24)": {
        img: "https://image.api.playstation.com/vulcan/ap/rnd/202307/0616/32777f9c2a3036920f7793540c76579679626496df0059e6.png",
        desc: "El juego de todos.",
        cat: "Deportes", date: "29/09/2023"
    }
};

// Lista de avatares base (se poblará con los canjeados)
const avatars = [ 
    'Felix', 'Aneka', 'Jorji', 'Precious', 'Mittens', 'Shadow', 'Gamer', 'Robot', 'Cyber', 'Ninja', 'Kratos', 'Zelda', 'Mario', 'Luigi', 'Sonic', 'Chief',
    'Pixel', 'Astronaut', 'Wizard', 'Dragon', 'Unicorn', 'Dino', 'Octopus', 'Rocket', 'Star', 'Moon', 'Sun', 'Cloud', 'Snow', 'Rain', 'Thunder' 
];

// --- 1. GESTIÓN DE AVATARES ---
function renderAvatarGrid() {
    const container = document.getElementById('avatar-grid');
    if(!container) return;
    container.innerHTML = '';
    
    const currentSelected = selectedAvatarSeed || 'Felix'; 
    
    // Usamos la lista 'avatars' que ahora contiene los canjeados
    [...new Set(avatars)].forEach(seed => { 
        const div = document.createElement('div');
        div.className = `avatar-option ${seed === currentSelected ? 'selected' : ''}`;
        div.onclick = (event) => selectAvatar(seed, event.currentTarget);
        div.innerHTML = `<img src="https://api.dicebear.com/7.x/bottts/svg?seed=${seed}" loading="lazy">`;
        container.appendChild(div);
    });
}

function selectAvatar(seed, selectedElement) {
    selectedAvatarSeed = seed;
    
    // 1. Actualizar el avatar principal inmediatamente
    document.getElementById('preview-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAvatarSeed}`;
    
    // 2. Limpiar clase 'selected' de todos los elementos (más estable que el redibujado)
    document.querySelectorAll('.avatar-option').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 3. Aplicar la clase 'selected' al elemento clicado
    if (selectedElement) {
        selectedElement.classList.add('selected');
    }
}

window.toggleAvatarMenu = function() {
    document.getElementById('avatar-dropdown').classList.toggle('active');
}

document.getElementById('btn-save-avatar')?.addEventListener('click', async () => {
    if(!currentUserID) return;
    const btn = document.getElementById('btn-save-avatar');
    btn.innerText = "Guardando..."; btn.disabled = true;
    try {
        await supabase.from('perfiles').update({ avatar: selectedAvatarSeed }).eq('id', currentUserID);
        Swal.fire({ title: 'Avatar Guardado', icon: 'success', timer: 1500, showConfirmButton: false, background: '#1a1a1a', color: '#fff' });
        toggleAvatarMenu();
    } catch(e) { Swal.fire('Error', 'Error al guardar', 'error'); } 
    finally { btn.innerText = "Guardar Avatar"; btn.disabled = false; }
});

// --- CERRAR DROPDOWN AL HACER CLICK FUERA ---
document.addEventListener('click', (event) => {
    const avatarDropdown = document.getElementById('avatar-dropdown');
    const avatarEditContainer = document.getElementById('avatar-edit-container');

    if (avatarDropdown && avatarDropdown.classList.contains('active')) {
        if (avatarEditContainer && !avatarEditContainer.contains(event.target)) {
            avatarDropdown.classList.remove('active');
        }
    }
});
// --------------------------------------------------------


// --- 2. EDICIÓN NOMBRE ---
document.getElementById('edit-username-btn')?.addEventListener('click', toggleUsernameEdit);

function toggleUsernameEdit() {
    const input = document.getElementById('input-username');
    const btn = document.getElementById('edit-username-btn');
    
    if (input.disabled) {
        input.disabled = false;
        input.focus();
        btn.innerHTML = '<i class="fas fa-check" style="color:var(--secondary);"></i>';
    } else {
        saveUsername(input.value, input, btn);
    }
}

async function saveUsername(newName, input, btn) {
    newName = newName.trim();
    if (newName === currentUsername || !newName) {
        input.value = currentUsername;
        input.disabled = true;
        btn.innerHTML = '<i class="fas fa-pen"></i>';
        return;
    }
    
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    try {
        const { error } = await supabase.from('perfiles').update({ username: newName }).eq('id', currentUserID);
        if (error) throw error;
        currentUsername = newName;
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Nombre actualizado', showConfirmButton: false, timer: 1500, background: '#222', color: '#fff' });
    } catch(e) {
        Swal.fire('Error', 'No se pudo actualizar', 'error');
        input.value = currentUsername;
    } finally {
        input.disabled = true;
        btn.innerHTML = '<i class="fas fa-pen"></i>';
    }
}

// --- 3. PESTAÑAS (TABS) ---
function setupTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(button.dataset.tab)?.classList.add('active');
        });
    });
}

// --- NUEVA FUNCIÓN: Cargar avatares canjeados del historial ---
async function cargarAvataresCanjeados(userId) {
    const { data: historial } = await supabase
        .from('historial_canjes')
        .select('premio_titulo')
        .eq('user_id', userId);

    if (!historial || historial.length === 0) return;

    const titulosCanjeados = [...new Set(historial.map(item => item.premio_titulo))];

    const { data: recompensas } = await supabase
        .from('recompensas_catalogo')
        .select('data_valor, tipo')
        .in('titulo', titulosCanjeados)
        .eq('tipo', 'avatar'); 

    if (!recompensas) return;

    // Agregar los nuevos seeds a la lista global 'avatars'
    recompensas.forEach(recompensa => {
        if (recompensa.data_valor && !avatars.includes(recompensa.data_valor)) {
            avatars.push(recompensa.data_valor);
        }
    });
}


// --- 4. INICIALIZACIÓN ---
async function initProfile() {
    const loading = document.getElementById('loading-overlay');
    try {
        const user = await getUser();
        if (loading) loading.style.display = 'none';
        
        if (!user) { 
            document.getElementById('guest-message').style.display = 'flex'; 
            return; 
        }

        document.getElementById('profile-content').style.display = 'flex';
        currentUserID = user.id;

        // CRÍTICO: 1. Cargar avatares canjeados ANTES de cargar el perfil
        await cargarAvataresCanjeados(user.id); 

        let { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).single();
        if(!perfil) perfil = { username: user.email.split('@')[0], puntos: 0, avatar: 'Felix' };

        const pts = perfil.puntos || 0;
        currentUsername = perfil.username || user.email.split('@')[0]; 
        
        document.getElementById('input-username').value = currentUsername; 
        document.getElementById('sidebar-level').innerText = Math.floor(pts / 1000) + 1;
        document.getElementById('sidebar-points').innerText = pts.toLocaleString();

        selectedAvatarSeed = perfil.avatar || 'Felix';
        document.getElementById('preview-avatar').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedAvatarSeed}`;
        
        // CRÍTICO: 2. Renderizar la cuadrícula con la lista 'avatars' actualizada
        renderAvatarGrid(); 
        setupTabs(); 
        
        await Promise.all([
            cargarBiblioteca(user.id), 
            cargarHistorialCanjes(user.id), 
            cargarWishlist(user.id)
        ]);

    } catch (err) { console.error(err); if(loading) loading.style.display = 'none'; }
}

// --- 5. BIBLIOTECA & UTILIDADES ---
window.copiarCodigo = function(codigo, elementoId) {
    navigator.clipboard.writeText(codigo).then(() => {
        const el = document.getElementById(elementoId);
        el.innerText = "¡COPIADO!";
        el.style.color = "#00ff88";
        setTimeout(() => { el.innerText = codigo; el.style.color = "var(--secondary)"; }, 1500);
    });
}

async function cargarBiblioteca(userId) {
    const gridInv = document.getElementById('library-grid');
    const { data: inventario } = await supabase.from('inventario').select('*').eq('user_id', userId);

    if (inventario && inventario.length > 0) {
        gridInv.innerHTML = '';
        
        const titulos = inventario.map(i => i.juego_titulo);
        const { data: juegosReales } = await supabase.from('juegos').select('*').in('titulo', titulos);
        const juegosMap = {};
        if(juegosReales) juegosReales.forEach(j => juegosMap[j.titulo] = j);

        inventario.forEach((item, index) => {
            const fakeKey = `GV-${item.juego_titulo.substring(0,3).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}-${index + 100}`;
            const uniqueID = `key-${index}`;
            
            let info = juegosMap[item.juego_titulo]; 
            if (!info) {
                const manual = manualGameData[item.juego_titulo];
                info = {
                    descripcion: manual ? manual.desc : "Juego exclusivo de GamerVault.",
                    genero: manual ? manual.cat : "Juego",
                    fecha_lanzamiento: manual ? manual.date : ""
                };
            }

            const fechaDisplay = info.fecha_lanzamiento || '';

            const card = document.createElement('div');
            card.className = 'library-card'; 
            
            card.innerHTML = `
                <div class="library-img-container">
                    <img src="${item.juego_imagen || 'https://placehold.co/400x300?text=No+Image'}" 
                         onerror="this.onerror=null;this.src='https://placehold.co/400x300?text=No+Image';">
                    <div class="library-copy-tag">Copia #${index + 1}</div>
                </div>
                <div class="library-content">
                    <p class="library-title">${item.juego_titulo}</p>
                    <div class="library-code-container" onclick="copiarCodigo('${fakeKey}', '${uniqueID}')">
                        <div id="${uniqueID}" class="library-code-blur">${fakeKey}</div>
                    </div>
                    <div class="library-actions">
                        <button onclick="mostrarDetallesJuego('${item.juego_titulo.replace(/'/g, "\\'")}', '${item.juego_imagen}', '${info.descripcion.replace(/'/g, "\\'")}', '${info.genero}', '${fechaDisplay}')" class="library-btn-action"><i class="fas fa-info-circle"></i></button>
                        <button onclick="generarTicketPDF('${item.juego_titulo}', '${item.juego_imagen}', '${fakeKey}')" class="library-btn-action btn-print"><i class="fas fa-download"></i></button>
                    </div>
                </div>
            `;
            gridInv.appendChild(card);
        });
    } else {
        gridInv.innerHTML = '<p class="text-muted-center">Aún no tienes juegos en tu biblioteca.</p>';
    }
}


// --- 6. GENERACIÓN DE PDF (CRÍTICA: Margen Cero) ---
window.generarTicketPDF = function(titulo, imagen_url, clave) {
    if (isPdfGenerating) return; 

    const el = document.getElementById('print-ticket-hidden');
    const transactionId = Math.floor(Math.random() * 90000) + 10000;
    
    if (!el || typeof html2pdf === 'undefined') return Swal.fire('Error', 'Librería PDF no cargada.', 'error');
    
    document.getElementById('ticket-juego-titulo').innerText = titulo.toUpperCase();
    
    // Asignar metadatos
    document.getElementById('ticket-clave').innerText = clave;
    document.getElementById('ticket-owner').innerText = currentUsername;
    document.getElementById('ticket-date').innerText = new Date().toLocaleDateString('es-ES'); 
    document.getElementById('ticket-id-transaccion').innerText = `#${transactionId}`; 

    const imgEl = document.getElementById('ticket-juego-imagen');
    imgEl.crossOrigin = "anonymous"; 
    
    const generateAndSave = () => {
        if (isPdfGenerating) return;
        isPdfGenerating = true;
        
        const template = document.getElementById('ticket-template');
        const opt = { 
            // CRÍTICO: Margen 0 para evitar que JS fuerce saltos de página.
            margin: 0, 
            filename: `GamerVault_${titulo}.pdf`, 
            image: { type: 'jpeg', quality: 1 }, 
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                allowTaint: true, 
                backgroundColor: '#000000' 
            }, 
            jsPDF: { 
                unit: 'mm', 
                format: 'a5', 
                orientation: 'portrait' 
            },
            // CRÍTICO: Mantiene el contenido en una sola página.
            pagebreak: { 
                mode: 'avoid-all' 
            }
        };

        html2pdf().set(opt).from(template).save().then(() => {
            isPdfGenerating = false; 
        });
        
        imgEl.onload = null;
        imgEl.onerror = null;
    };
    
    // 1. Caso Rápido: La imagen ya tiene la URL y cargó 
    if (imgEl.src === imagen_url && imgEl.complete) {
        generateAndSave();
        return;
    }

    // 2. Esperar por el evento de carga o error 
    imgEl.onload = generateAndSave;
    imgEl.onerror = () => {
        // Fallback si la imagen no carga
        imgEl.src = 'https://placehold.co/400x300?text=No+Image'; 
        generateAndSave();
    };
    
    // Disparar la carga
    imgEl.src = imagen_url; 
}
// -------------------------------------------------------------


// --- 7. WISHLIST ---
async function cargarWishlist(userId) {
    const container = document.getElementById('wishlist-grid');
    const { data: list } = await supabase.from('wishlist').select('juego_titulo').eq('user_id', userId);
    
    if (list && list.length > 0) {
        container.innerHTML = '';
        
        const titulosDeseados = list.map(item => item.juego_titulo);
        const { data: juegosReales } = await supabase.from('juegos').select('*').in('titulo', titulosDeseados);
            
        const juegosMap = {};
        if (juegosReales) {
            juegosReales.forEach(j => { juegosMap[j.titulo] = j; });
        }

        list.forEach(item => {
            const titulo = item.juego_titulo;
            
            let data = juegosMap[titulo];
            
            let imagen = `https://placehold.co/400x300/1a1a20/b26bff?text=${encodeURIComponent(titulo)}`;
            let desc = 'Detalles no disponibles.';
            let cat = 'Juego';
            let date = ''; 

            if (data) {
                imagen = data.imagen_url || imagen;
                desc = data.descripcion || desc;
                cat = data.genero || cat;
                date = data.fecha_lanzamiento || ''; 
            } 
            else {
                let manual = manualGameData[titulo];
                if (!manual) {
                    const manualKey = Object.keys(manualGameData).find(k => 
                        k.toLowerCase().includes(titulo.toLowerCase()) || 
                        titulo.toLowerCase().includes(k.toLowerCase())
                    );
                    if(manualKey) manual = manualGameData[manualKey];
                }

                if (manual) {
                    imagen = manual.img;
                    desc = manual.desc;
                    cat = manual.cat;
                    date = manual.date || '';
                }
            }

            const card = document.createElement('div'); 
            card.className = 'wishlist-card';
            
            card.innerHTML = `
                <div class="wishlist-img-wrapper">
                    <img src="${imagen}" alt="${titulo}" 
                         onerror="this.onerror=null; this.src='https://placehold.co/400x300/1a1a20/b26bff?text=Error';">
                </div>
                <div class="wishlist-info">
                    <p class="wishlist-title" title="${titulo}">${titulo}</p>
                    <button onclick="mostrarDetallesJuego('${titulo.replace(/'/g, "\\'")}', '${imagen}', '${desc.replace(/'/g, "\\'")}', '${cat}', '${date}')" class="wishlist-btn-view">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
    } else { 
        container.innerHTML = '<p class="text-muted-center">Wishlist vacía. ¡Explora el catálogo!</p>'; 
    }
}


// --- 8. HISTORIAL CANJES (CON ICONOS) ---
async function cargarHistorialCanjes(userId) {
    const container = document.getElementById('rewards-grid');
    // Muestra "Cargando historial..." mientras se ejecuta la función
    container.innerHTML = '<div class="text-muted-center">Cargando historial...</div>'; 

    const { data: historial, error: historyError } = await supabase
        .from('historial_canjes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (historyError) { 
        console.error("Error cargando historial de canjes:", historyError.message); 
        container.innerHTML = '<p class="text-muted-center" style="color:red;">Error al cargar el historial de canjes.</p>';
        return; 
    }

    if (historial && historial.length > 0) {
        
        // 1. Obtener la información del catálogo para saber qué semilla de avatar corresponde al premio
        const { data: allRewards } = await supabase
            .from('recompensas_catalogo')
            .select('titulo, data_valor, tipo')
            .in('titulo', historial.map(i => i.premio_titulo)); // Solo buscar los títulos que existen en el historial
        
        const rewardMap = new Map();
        if(allRewards) {
            allRewards.forEach(r => rewardMap.set(r.titulo, { value: r.data_valor, type: r.tipo }));
        }
        
        const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;

        container.innerHTML = '';
        
        historial.forEach((item) => {
            const card = document.createElement('div');
            card.className = 'reward-history-card';
            let iconHtml = '<i class="fas fa-gift reward-icon"></i>';
            let name = item.premio_titulo || 'Canje Desconocido'; 
            let premioInfo = rewardMap.get(name) || { value: null, type: 'general' };
            let fechaCanje = new Date(item.created_at).toLocaleDateString('es-ES');
            
            // 2. Lógica para mostrar el icono correcto (Avatar, Banner o General)
            if (premioInfo.type === 'avatar' && premioInfo.value) {
                const avatarSeed = premioInfo.value;
                iconHtml = `<img src="${getAvatarUrl(avatarSeed)}" class="reward-avatar-img" alt="Avatar Canjeado">`;
            } else if (name.toLowerCase().includes('banner')) {
                iconHtml = `<i class="fas fa-image reward-icon" style="color:#ffc107;"></i>`;
            } else if (name.toLowerCase().includes('puntos')) {
                iconHtml = `<i class="fas fa-gem reward-icon" style="color:var(--secondary);"></i>`;
            }

            // 3. Generar botón de ticket solo si hay código de canje
            const ticketButton = item.codigo_canje 
                ? `<button class="btn-ticket" onclick="window.generarTicketPDF('${name.replace(/'/g, "\\'")}', 'https://placehold.co/400x300?text=${encodeURIComponent(name)}', '${item.codigo_canje}')"><i class="fas fa-ticket-alt"></i> Ticket</button>`
                : '';
            
            card.innerHTML = `
                <div class="reward-icon-wrapper">${iconHtml}</div>
                <div class="reward-details">
                    <p class="reward-name">${name}</p>
                    <span class="reward-cost">-${item.costo_puntos.toLocaleString()} <i class="fas fa-gem"></i></span>
                    <span class="reward-date">${fechaCanje}</span> 
                </div>
                
                <div class="reward-actions-group">
                    ${ticketButton}
                </div>
            `;
            container.appendChild(card);
        });
    } else { 
        container.innerHTML = '<p class="text-muted-center">Aún no has canjeado recompensas.</p>'; 
    }
}


// --- 9. MODAL DETALLES ---
window.mostrarDetallesJuego = function(titulo, imagen_url, descripcion, categoria, fechaLanzamiento) {
    const fechaHtml = fechaLanzamiento 
        ? `<span style="color:white;"><i class="fas fa-calendar" style="color:var(--neon)"></i> ${fechaLanzamiento}</span>` 
        : ''; 

    Swal.fire({
        title: `<span style="color:var(--neon); letter-spacing:1px; font-family:'Orbitron'">${titulo.toUpperCase()}</span>`,
        html: `
            <div style="text-align: left;">
                <img src="${imagen_url}" onerror="this.src='https://placehold.co/400x300?text=No+Image';" style="width: 100%; height: 200px; object-fit: cover; border-radius: 10px; border: 1px solid #333; margin-bottom: 15px; box-shadow:0 0 20px rgba(178, 107, 255, 0.2);">
                <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-size:0.9rem; border-bottom:1px solid #333; padding-bottom:10px;">
                    <span style="color:white; background:#222; padding:3px 10px; border-radius:15px;"><i class="fas fa-tag" style="color:var(--neon)"></i> ${categoria}</span>
                    ${fechaHtml} </div>
                <p style="color:#ccc; font-size:0.95rem; line-height:1.6;">${descripcion}</p>
            </div>
        `,
        background: '#15151a', color: '#fff', showConfirmButton: false, showCloseButton: true, width: 500
    });
};

initProfile();