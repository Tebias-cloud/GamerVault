import { supabase, getUser } from './supabaseClient.js';

let userPoints = 0;
let currentUser = null;

const pointsDisplay = document.getElementById('user-points');
const container = document.getElementById('rewards-container');

// Función expuesta globalmente para los botones HTML
window.filtrarRecompensas = function(tipo, btnElement) {
    document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    const secciones = document.querySelectorAll('.reward-section-wrapper');
    secciones.forEach(seccion => {
        if (tipo === 'all') {
            seccion.style.display = 'block';
        } else {
            if (seccion.id === `section-${tipo}`) {
                seccion.style.display = 'block';
            } else {
                seccion.style.display = 'none';
            }
        }
    });
};

function updatePointsDisplay(newPoints) {
    userPoints = newPoints;
    if(pointsDisplay) pointsDisplay.innerText = userPoints.toLocaleString();
}

async function initRewards() {
    console.log("🚀 Cargando Mercado...");
    try {
        currentUser = await getUser();

        if (!currentUser) {
            if (container) container.innerHTML = `<div style="text-align:center; padding:50px;"><h2>🔒 Acceso Restringido</h2><a href="login.html" class="btn">Iniciar Sesión</a></div>`;
            return;
        }

        const { data: perfil } = await supabase.from('perfiles').select('puntos').eq('id', currentUser.id).single();
        updatePointsDisplay(perfil?.puntos || 0);

        const { data: historial } = await supabase.from('historial_canjes').select('premio_titulo').eq('user_id', currentUser.id);
        const ownedTitles = historial ? historial.map(h => h.premio_titulo) : [];
        window.ownedTitlesCache = ownedTitles;

        const { data: catalogo, error } = await supabase.from('recompensas_catalogo').select('*').order('costo', { ascending: true });
        if (error) throw error;

        window.itemsCache = catalogo;
        renderCatalogo(catalogo, ownedTitles);

    } catch (err) {
        console.error("Error:", err);
        if (container) container.innerHTML = `<div style="text-align:center; color:red;">Error al cargar el mercado.</div>`;
    }
}

function renderCatalogo(items, ownedTitles) {
    if (!container) return;
    container.innerHTML = ''; 

    const avatares = items.filter(i => i.tipo === 'avatar');
    const banners = items.filter(i => i.tipo === 'banner');
    const extras = items.filter(i => i.tipo === 'codigo');

    if (avatares.length > 0) renderSection("Iconos & Avatares", "fa-user-astronaut", avatares, ownedTitles, "avatar");
    if (banners.length > 0) renderSection("Banners de Perfil", "fa-image", banners, ownedTitles, "banner");
    if (extras.length > 0) renderSection("Tarjetas & Extras", "fa-gift", extras, ownedTitles, "codigo");
}

function renderSection(title, icon, items, ownedTitles, typeId) {
    const wrapper = document.createElement('div');
    wrapper.className = 'reward-section-wrapper';
    wrapper.id = `section-${typeId}`; 

    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'category-separator';
    sectionHeader.innerHTML = `<h3 class="category-title"><i class="fas ${icon}"></i> ${title}</h3>`;
    wrapper.appendChild(sectionHeader);

    const sectionGrid = document.createElement('div');
    sectionGrid.className = 'category-grid';

    items.forEach(item => {
        const isOwned = ownedTitles.includes(item.titulo);
        let btnState = '', btnText = `Canjear`, btnClass = 'btn-claim';

        // CORRECCIÓN CLAVE: Si es Avatar o Banner, y ya lo tiene, se muestra como poseído.
        if (isOwned && (item.tipo === 'avatar' || item.tipo === 'banner' || item.unico)) { 
            btnState = 'disabled'; btnText = 'En posesión'; btnClass += ' owned';
        } else if (userPoints < item.costo) { 
            btnState = 'disabled'; btnText = `Faltan ${item.costo - userPoints}`;
        }

        // Lógica Iconos
        let iconHtml = '';
        let cardClass = 'reward-card';
        
        if (item.tipo === 'banner') {
            cardClass += ' is-banner';
            iconHtml = `<img src="${item.data_valor}" alt="Banner" onerror="this.src='https://placehold.co/600x200?text=Banner'">`;
        } else if (item.tipo === 'avatar') {
            iconHtml = `<img src="https://api.dicebear.com/7.x/bottts/svg?seed=${item.data_valor}" style="width:100%;height:100%;border-radius:50%;">`;
        } else {
            let faPrefix = 'fas';
            if (['spotify', 'discord', 'steam', 'playstation', 'xbox', 'twitch', 'amazon'].some(b => item.imagen_icono.includes(b))) faPrefix = 'fa-brands';
            const iconClass = item.imagen_icono.startsWith('fa-') ? item.imagen_icono : `fa-${item.imagen_icono}`;
            iconHtml = `<i class="${faPrefix} ${iconClass}"></i>`;
        }

        const card = document.createElement('div');
        card.className = cardClass;
        card.innerHTML = `
            <div class="reward-icon-box">${iconHtml}</div>
            <h3 class="reward-title">${item.titulo}</h3>
            <div class="reward-cost"><i class="fas fa-gem"></i> ${item.costo.toLocaleString()}</div>
            <button class="${btnClass}" ${btnState} onclick="procesarCompra(${item.id})">${btnText}</button>
        `;
        sectionGrid.appendChild(card);
    });

    wrapper.appendChild(sectionGrid);
    container.appendChild(wrapper);
}

// --- LÓGICA DE COMPRA (CORREGIDA CON MANEJO DE ERRORES FUERTE) ---
window.procesarCompra = async (itemId) => {
    const item = window.itemsCache.find(i => i.id === itemId);
    if (!item) return;

    const confirm = await Swal.fire({
        title: `¿Canjear ${item.titulo}?`,
        html: `Costará <b style="color:#00ff88">${item.costo.toLocaleString()}</b> puntos.`,
        icon: 'question', showCancelButton: true,
        confirmButtonColor: '#00ff88', cancelButtonColor: '#d33', confirmButtonText: 'Confirmar',
        background: '#1a1a1a', color: '#fff'
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({title:'Procesando...', didOpen:()=>{Swal.showLoading()}, background:'#1a1a1a', color:'#fff', showConfirmButton:false});

    try {
        const nuevosPuntos = userPoints - item.costo;

        // 1. ACTUALIZAR PUNTOS
        const { error: pointsError } = await supabase.from('perfiles').update({ puntos: nuevosPuntos }).eq('id', currentUser.id);
        if(pointsError) throw new Error("Fallo al actualizar puntos.");

        // 2. ACTUALIZAR PERFIL (Avatar/Banner)
        if (item.tipo === 'avatar') {
            await supabase.from('perfiles').update({ avatar: item.data_valor }).eq('id', currentUser.id);
        }
        if (item.tipo === 'banner') {
            await supabase.from('perfiles').update({ banner_url: item.data_valor }).eq('id', currentUser.id);
        }

        // 3. REGISTRAR EL CANJE EN HISTORIAL
        const codigo = `${item.titulo.substring(0,3).toUpperCase()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
        const { error: historialError } = await supabase.from('historial_canjes').insert([{
            user_id: currentUser.id, premio_titulo: item.titulo, costo_puntos: item.costo, codigo_canje: codigo
        }]);
        if(historialError) throw new Error("Fallo al registrar canje.");


        // 4. ÉXITO (Actualizar UI local)
        updatePointsDisplay(nuevosPuntos);
        window.ownedTitlesCache.push(item.titulo);
        
        renderCatalogo(window.itemsCache, window.ownedTitlesCache); // Re-renderizar
        
        if (item.tipo === 'codigo') generarTicketPDF(item.titulo, codigo);
        
        // Usamos SweetAlert para informar al usuario de la acción completada
        Swal.fire({ icon: 'success', title: '¡Canjeado!', text: 'Tu perfil se actualizará al visitar la sección correspondiente.', background: '#1a1a1a', color: '#fff' });

    } catch (e) {
        console.error("Error crítico en la transacción:", e.message);
        Swal.fire('Error de Permisos o Datos', 'No se pudo completar el canje. Revisa la consola (F12).', 'error');
    }
};

async function generarTicketPDF(nombre, codigo) {
    // Lógica PDF se mantiene en el otro archivo
    console.log("Generando PDF para:", nombre, codigo);
}

initRewards();