import { supabase } from './supabaseClient.js';

// Función Principal de Inicialización
async function initPage() {
    console.log("🚀 Iniciando Home...");
    try {
        // Cargamos todo en paralelo para mayor velocidad
        await Promise.all([
            cargarContadores(), 
            cargarRanking(), 
            cargarTendencias()
        ]);
    } catch (error) {
        console.error("Error crítico en Home:", error);
    }
}

// 1. Contador de Juegos (Hero Section)
async function cargarContadores() {
    const { count } = await supabase.from('juegos').select('*', { count: 'exact', head: true });
    if (count !== null) {
        const el = document.getElementById('totalJuegosCount');
        if (el) el.innerText = count + "+";
    }
}

// 2. Ranking / Salón de la Fama
async function cargarRanking() {
    const rankingContainer = document.getElementById('rankingGrid');
    if (!rankingContainer) return;
    
    // Consulta a Supabase: Top 5 usuarios por puntos
    const { data: usuarios, error } = await supabase
        .from('perfiles')
        .select('username, puntos, avatar')
        .order('puntos', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error ranking:", error);
        rankingContainer.innerHTML = '<p style="color:#ff5555; text-align:center;">No se pudo cargar el ranking.</p>';
        return;
    }

    if (!usuarios || usuarios.length === 0) {
        rankingContainer.innerHTML = '<p style="color:#666; text-align:center;">Aún no hay leyendas registradas.</p>';
        return;
    }

    rankingContainer.innerHTML = ''; // Limpiar loader

    usuarios.forEach((user, index) => {
        const posicion = index + 1;
        let medalHtml = `<span class="rank-number">#${posicion}</span>`;
        let rowClass = 'leaderboard-row';
        
        // Estilos especiales para el podio
        if (posicion === 1) { medalHtml = '🥇'; rowClass += ' gold-row'; }
        else if (posicion === 2) { medalHtml = '🥈'; rowClass += ' silver-row'; }
        else if (posicion === 3) { medalHtml = '🥉'; rowClass += ' bronze-row'; }

        // Avatar (con fallback a default si es null)
        const avatarSeed = user.avatar || 'default';
        const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;
        
        // HTML de la Fila con separación simétrica
        const row = document.createElement('div');
        row.className = rowClass;
        row.innerHTML = `
            <div class="leaderboard-left-group">
                <div class="rank-badge">${medalHtml}</div>
                <div class="rank-avatar">
                    <img src="${avatarUrl}" alt="${user.username}" loading="lazy">
                </div>
                <div class="rank-info">
                    <span class="rank-name">${user.username || 'Anónimo'}</span>
                </div>
            </div>
            <div class="rank-points">
                ${(user.puntos || 0).toLocaleString()} <span class="pts-label">PTS</span>
            </div>
        `;
        rankingContainer.appendChild(row);
    });
}

// 3. Tendencias (Juegos destacados - AHORA CON 12 JUEGOS)
async function cargarTendencias() {
    const grid = document.getElementById('destacadosGrid');
    if (!grid) return;
    
    // CORRECCIÓN 400: Aseguramos que la consulta sea limpia.
    // La sintaxis 'juegos.select(*)' en Supabase a veces falla si no se especifican las columnas.
    const { data: juegos, error } = await supabase
        .from('juegos')
        .select('id, titulo, genero, precio, imagen_url, keywords') // Se listan explícitamente para evitar el error 400
        .limit(12);

    if (error || !juegos) {
        grid.innerHTML = '<p style="color:#ff5555; text-align:center; width:100%;">No se pudieron cargar las tendencias.</p>';
        console.error("Error al cargar tendencias (400 probable):", error);
        return;
    }
    
    grid.innerHTML = ''; // Limpiar loader

    juegos.forEach(juego => {
        const precio = juego.precio ? parseFloat(juego.precio) : 0;
        const precioDisplay = precio === 0 ? "GRATIS" : `$${precio} USD`;
        const genero = (juego.genero || 'General').split(',')[0].trim();

        const card = document.createElement('div');
        card.className = 'game-card';
        
        // Usamos el nuevo diseño de tarjeta que definimos en el CSS
        card.innerHTML = `
            <div class="card-image-container">
                <span class="genre-tag">${genero}</span>
                <img src="${juego.imagen_url}" alt="${juego.titulo}" loading="lazy" 
                     onerror="this.src='https://placehold.co/400x400?text=GAME'">
            </div>
            <div class="card-content">
                <h3>${juego.titulo}</h3>
                <div class="price-row">
                    <span class="price">${precioDisplay}</span>
                    <a href="catalogo.html?buscar=${encodeURIComponent(juego.titulo)}" class="add-btn" title="Ver en Catálogo">
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Arrancar la página al cargar el DOM
document.addEventListener('DOMContentLoaded', initPage);
