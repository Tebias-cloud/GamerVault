import { supabase, getUser } from './supabaseClient.js';
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js';

const grid = document.getElementById('catalogGrid');
const filterContainer = document.getElementById('filterContainer');
const searchInput = document.getElementById('searchInput');

let todosLosJuegos = [];
let inventarioMap = {}; 
let wishlistSet = new Set(); 
let fuse; 

async function iniciarCatalogo() {
    try {
        const user = await getUser();
        const promesas = [supabase.from('juegos').select('*')];
        
        if (user) {
            promesas.push(supabase.from('inventario').select('juego_titulo').eq('user_id', user.id));
            promesas.push(supabase.from('wishlist').select('juego_titulo').eq('user_id', user.id));
        }

        const [juegosRes, invRes, wishRes] = await Promise.all(promesas);
        if (juegosRes.error) throw juegosRes.error;
        todosLosJuegos = juegosRes.data;

        if (invRes && invRes.data) {
            inventarioMap = invRes.data.reduce((acc, item) => {
                acc[item.juego_titulo] = (acc[item.juego_titulo] || 0) + 1;
                return acc;
            }, {});
        }

        if (wishRes && wishRes.data) wishlistSet = new Set(wishRes.data.map(w => w.juego_titulo));

        const options = { includeScore: true, threshold: 0.3, keys: ['titulo', 'genero', 'keywords'] };
        fuse = new Fuse(todosLosJuegos, options);

        generarFiltros(todosLosJuegos);
        
        const params = new URLSearchParams(window.location.search);
        const busquedaUrl = params.get('buscar');

        if (busquedaUrl) {
            if(searchInput) searchInput.value = busquedaUrl;
            ejecutarBusqueda(busquedaUrl);
            window.history.replaceState({}, document.title, "catalogo.html");
        } else {
            renderizarJuegos(todosLosJuegos);
        }

        if(searchInput) searchInput.addEventListener('input', (e) => ejecutarBusqueda(e.target.value));

    } catch (err) {
        console.error("Error catálogo:", err);
        grid.innerHTML = '<div class="loading-msg" style="color:#ff5555;">Error conectando con el servidor.</div>';
    }
}

function ejecutarBusqueda(texto) {
    const query = texto.trim();
    if (query.length === 0) renderizarJuegos(todosLosJuegos);
    else {
        const resultados = fuse.search(query);
        renderizarJuegos(resultados.map(r => r.item));
    }
}

// --- 3. RENDERIZADO VISUAL (ACTUALIZADO) ---
function renderizarJuegos(lista) {
    grid.innerHTML = ''; 
    
    if (lista.length === 0) {
        grid.innerHTML = '<div class="loading-msg">No se encontraron juegos.</div>';
        return;
    }

    lista.forEach(juego => {
        const titulo = juego.titulo;
        const tituloSafe = titulo.replace(/'/g, "\\'"); 
        
        const precio = juego.precio ? parseFloat(juego.precio) : 0;
        const precioDisplay = precio === 0 ? "GRATIS" : `$${precio} USD`;
        const puntosGanados = precio > 1000 ? Math.floor(precio / 10) : Math.floor(precio * 100);
        
        // 1. PROCESAR GÉNEROS MÚLTIPLES
        // Tomamos el string (ej: "Acción, Aventura"), lo separamos y creamos un span para cada uno
        const generosArray = (juego.genero || 'General').split(',');
        const generosHTML = generosArray.map(g => 
            `<span class="meta-pill">${g.trim()}</span>`
        ).join('');
        
        const copias = inventarioMap[titulo] || 0;
        const esFavorito = wishlistSet.has(titulo);
        const heartClass = esFavorito ? 'active' : '';

        // Badges HTML
        let badgeHTML = '';
        if (copias > 0) {
            badgeHTML = `<div class="badge owned-badge"><i class="fas fa-key"></i> Tienes: ${copias}</div>`;
        } else {
            badgeHTML = `<div class="badge points-badge"><i class="fas fa-gem"></i> +${puntosGanados} Pts</div>`;
        }

        const card = document.createElement('div');
        card.className = 'game-card';
        
        card.innerHTML = `
            <div class="card-image-container">
                <button class="wishlist-btn ${heartClass}" title="Favoritos" onclick="window.toggleWish('${tituloSafe}', this); event.stopPropagation();">
                    <i class="fas fa-heart"></i>
                </button>
                ${badgeHTML}
                
                <img src="${juego.imagen_url}" alt="${titulo}" loading="lazy" 
                     style="cursor:pointer;" 
                     onclick="window.abrirModal('${tituloSafe}')"
                     onerror="this.src='https://placehold.co/400x300?text=GAME'">
            </div>
            <div class="card-content">
                <h3>${titulo}</h3>
                
                <div class="card-meta-row">
                    ${generosHTML}
                </div>

                <div class="price-row">
                    <span class="price">${precioDisplay}</span>
                    <button class="add-btn" title="Comprar" onclick="window.abrirModal('${tituloSafe}')">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.toggleWish = async function(titulo, btnElement) {
    const user = await getUser();
    if (!user) return Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Inicia sesión', background: '#222', color: '#fff', timer: 3000, showConfirmButton: false });

    const isNowActive = !wishlistSet.has(titulo);
    if (btnElement) btnElement.classList.toggle('active');

    if (!isNowActive) {
        wishlistSet.delete(titulo);
        await supabase.from('wishlist').delete().eq('user_id', user.id).eq('juego_titulo', titulo);
    } else {
        wishlistSet.add(titulo);
        await supabase.from('wishlist').insert([{ user_id: user.id, juego_titulo: titulo }]);
    }
}

window.abrirModal = function(tituloBuscado) {
    const juego = todosLosJuegos.find(j => j.titulo === tituloBuscado);
    if (!juego) return;

    const modal = document.getElementById('gameModal');
    document.getElementById('modalImg').src = juego.imagen_url;
    document.getElementById('modalTitle').innerText = juego.titulo;
    
    const generosHTML = (juego.genero || 'Acción').split(',').map(g => `<span class="genre-pill">${g.trim()}</span>`).join('');
    document.getElementById('modalGenresContainer').innerHTML = generosHTML;
    
    const precio = juego.precio ? parseFloat(juego.precio) : 0;
    document.getElementById('modalPriceBadge').innerText = precio === 0 ? "GRATIS" : `$${precio}`;
    
    const puntos = precio > 1000 ? Math.floor(precio / 10) : Math.floor(precio * 100);
    document.getElementById('modalPointsBadge').innerHTML = `<i class="fas fa-gem"></i> +${puntos} Pts`;
    document.getElementById('modalDesc').innerText = juego.descripcion || "Descripción no disponible.";

    const btnContainer = document.getElementById('modalBtnContainer');
    btnContainer.innerHTML = ''; 
    const btn = document.createElement('button');
    btn.className = 'btn-neon-modal';
    btn.innerHTML = `<i class="fas fa-shopping-cart"></i> COMPRAR AHORA`;
    btn.onclick = function() { window.closeModal(); setTimeout(() => comprarJuego(juego, puntos, null), 300); };
    btnContainer.appendChild(btn);

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);
}

window.closeModal = function() {
    const modal = document.getElementById('gameModal');
    modal.classList.remove('open');
    setTimeout(() => { modal.style.display = 'none'; }, 300); 
}

document.getElementById('gameModal').addEventListener('click', (e) => { if (e.target.id === 'gameModal') window.closeModal(); });

async function comprarJuego(juego, pts, btn) {
    const user = await getUser();
    if (!user) return Swal.fire({ icon: 'info', title: 'Identifícate', text: 'Inicia sesión para comprar.', confirmButtonColor: '#b26bff', background: '#1a1a1a', color: '#fff' }).then((r) => { if(r.isConfirmed) window.location.href = 'login.html'; });

    const confirm = await Swal.fire({
        title: `¿Comprar ${juego.titulo}?`,
        html: `Se añadirá a tu biblioteca.<br>Ganarás <b style="color:#00ff88">+${pts} Puntos</b>`,
        imageUrl: juego.imagen_url, imageWidth: 300, imageHeight: 150,
        showCancelButton: true, confirmButtonColor: '#b26bff', cancelButtonColor: '#d33', 
        confirmButtonText: 'Sí, comprar', background: '#1a1a1a', color: '#fff'
    });

    if (!confirm.isConfirmed) return;

    try {
        const { data: perfil } = await supabase.from('perfiles').select('puntos').eq('id', user.id).single();
        const nuevosPuntos = (perfil?.puntos || 0) + pts;
        const { error: invError } = await supabase.from('inventario').insert([{ user_id: user.id, juego_titulo: juego.titulo, juego_imagen: juego.imagen_url }]);
        if (invError) throw invError;
        await supabase.from('perfiles').update({ puntos: nuevosPuntos }).eq('id', user.id);
        Swal.fire({ icon: 'success', title: '¡Comprado!', text: 'Juego añadido.', background: '#1a1a1a', color: '#fff', confirmButtonColor: '#00ff88' }).then(() => location.reload());
    } catch (error) {
        console.error("Error compra:", error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo procesar la compra.', background: '#1a1a1a', color: '#fff' });
    }
}

function generarFiltros(juegos) {
    const generos = [...new Set(juegos.map(j => (j.genero || "").split(',')[0].trim()).filter(g=>g))];
    filterContainer.innerHTML = '';
    const crearBtn = (texto, filtro) => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${filtro === 'all' ? 'active' : ''}`;
        btn.innerText = texto;
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if(searchInput) searchInput.value = ''; 
            if (filtro === 'all') renderizarJuegos(todosLosJuegos);
            else renderizarJuegos(todosLosJuegos.filter(j => (j.genero || "").includes(filtro)));
        };
        filterContainer.appendChild(btn);
    };
    crearBtn('Todos', 'all');
    generos.forEach(g => crearBtn(g, g));
}

iniciarCatalogo();