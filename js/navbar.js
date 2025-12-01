import { supabase } from './supabaseClient.js';

// HTML con estructura para Avatar
const navbarHTML = `
    <a href="index.html" class="logo">
        <i class="fas fa-gamepad"></i> GamerVault
    </a>
    
    <div class="nav-links">
      <a href="index.html" data-page="index.html">Inicio</a>
      <a href="catalogo.html" data-page="catalogo.html">Catálogo</a>
      <a href="sobre.html" data-page="sobre.html">Nosotros</a>
      <a href="recompensas.html" data-page="recompensas.html">Recompensas</a>
      <a href="perfil.html" data-page="perfil.html">Perfil</a>
    </div>

    <div class="nav-auth">
        <div id="nav-user-panel" class="user-panel" style="display: none;">
            
            <div class="nav-points" title="Saldo Disponible">
                <span id="nav-points-val" class="skeleton">00000</span> 
                <i class="fas fa-gem"></i>
            </div>

            <div class="nav-divider"></div>

            <div class="user-info">
                <span id="nav-username" class="skeleton">Usuario</span>
                
                <img id="nav-user-avatar" src="" alt="Avatar" class="nav-avatar" style="display:none;">

                <button id="nav-logout-btn" title="Cerrar Sesión">
                    <i class="fas fa-power-off"></i>
                </button>
            </div>
        </div>

        <a href="login.html" class="btn-login" id="nav-login-link" style="display: none;">Login</a>
    </div>
`;

// Función para animar números (Efecto RPG)
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        obj.innerHTML = value.toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.classList.remove('skeleton'); // Quitar efecto de carga al terminar
        }
    };
    window.requestAnimationFrame(step);
}

export async function initNavbar() {
    try {
        const headerElement = document.querySelector('header.navbar');
        if (!headerElement) return;
        headerElement.innerHTML = navbarHTML;

        const path = window.location.pathname;
        let currentPage = path.substring(path.lastIndexOf('/') + 1) || "index.html";
        const activeLink = document.querySelector(`a[data-page="${currentPage}"]`);
        if (activeLink) activeLink.classList.add('active');

        // Verificar Sesión
        const { data: { user } } = await supabase.auth.getUser();

        const loginLink = document.getElementById('nav-login-link');
        const userPanel = document.getElementById('nav-user-panel');
        const usernameDisplay = document.getElementById('nav-username');
        const pointsDisplay = document.getElementById('nav-points-val');
        const avatarDisplay = document.getElementById('nav-user-avatar');
        const logoutBtn = document.getElementById('nav-logout-btn');

        if (user) {
            if(loginLink) loginLink.style.display = 'none';
            if(userPanel) userPanel.style.display = 'flex';
            
            // Traer Avatar, Nombre y Puntos
            const { data: perfil } = await supabase
                .from('perfiles')
                .select('username, puntos, avatar') 
                .eq('id', user.id)
                .maybeSingle();

            const nombre = perfil?.username || user.email.split('@')[0];
            const puntos = perfil?.puntos || 0;
            const avatarSeed = perfil?.avatar || 'default';

            // 1. Actualizar Nombre (Quitar skeleton)
            usernameDisplay.innerText = nombre;
            usernameDisplay.classList.remove('skeleton');

            // 2. Actualizar Avatar
            avatarDisplay.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`;
            avatarDisplay.style.display = 'block'; // Mostrar imagen

            // 3. Animar Puntos (0 -> Puntos Reales)
            pointsDisplay.classList.remove('skeleton'); // Quitar fondo gris
            animateValue(pointsDisplay, 0, puntos, 1500); // 1.5 segundos de animación

            // Logout
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    const confirmLogout = typeof Swal !== 'undefined' 
                        ? await Swal.fire({ title: '¿Salir?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#b26bff', cancelButtonColor: '#d33', confirmButtonText: 'Sí', background: '#1a1a1a', color: '#fff', width: 300 })
                        : { isConfirmed: confirm("¿Salir?") };

                    if (confirmLogout.isConfirmed) {
                        await supabase.auth.signOut();
                        window.location.href = 'index.html';
                    }
                });
            }
        } else {
            if(loginLink) loginLink.style.display = 'block';
        }

    } catch (error) {
        console.error("Error Navbar:", error);
        const loginLink = document.getElementById('nav-login-link');
        if(loginLink) loginLink.style.display = 'block';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}