/**
 * Sidebar Component - Estilo Dark Premium con fijación para Móvil
 */
export function cargarSidebar(paginaActiva) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    // 1. ESTRUCTURA HTML (VISTA)
    container.innerHTML = `
        <nav class="navbar navbar-dark bg-primary d-md-none fixed-top shadow">
            <div class="container-fluid">
                <span class="navbar-brand fw-bold">Lab Track</span>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebarMenu" aria-controls="sidebarMenu" aria-expanded="false" aria-label="Toggle navigation">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        </nav>

        <div class="collapse d-md-block sidebar shadow-sm" id="sidebarMenu">
            <div class="sidebar-header p-4 d-none d-md-block text-center">
                <div class="brand-logo-small mb-2">
                    <img src="./assets/img/icono.png" 
                        class="img-fluid" 
                        style="max-height: 60px; filter: brightness(0) invert(1);" 
                        alt="Logo" />
                </div>
                <h5 class="fw-bold text-white m-0">Lab Manager</h5>
                <p class="text-muted extra-small">Control de Calidad</p>
            </div>

            <ul class="nav flex-column px-3 mt-md-0 mt-3">
                <li class="nav-item mb-2">
                    <a class="nav-link rounded-3 ${paginaActiva === 'dashboard' ? 'active shadow-sm' : 'text-secondary'}" href="dashboard.html">
                        <i class="fas fa-chart-pie me-2"></i> Dashboard
                    </a>
                </li>
                <li class="nav-item mb-2">
                    <a class="nav-link rounded-3 ${paginaActiva === 'inventario' ? 'active shadow-sm' : 'text-secondary'}" href="inventario.html">
                        <i class="fas fa-boxes-stacked me-2"></i> Inventario
                    </a>
                </li>
                <li class="nav-item mb-2">
                    <a class="nav-link rounded-3 ${paginaActiva === 'equipos' ? 'active shadow-sm' : 'text-secondary'}" href="equipos.html">
                        <i class="fas fa-microscope me-2"></i> Equipos
                    </a>
                </li>
                <li class="nav-item mb-2">
                    <a class="nav-link rounded-3 ${paginaActiva === 'incidencias' ? 'active shadow-sm' : 'text-secondary'}" href="reportes.html">
                        <i class="fas fa-clipboard-list me-2"></i> Incidencias
                    </a>
                </li>
                <li class="nav-item mb-2">
                    <a class="nav-link rounded-3 ${paginaActiva === 'laboratorios' ? 'active shadow-sm' : 'text-secondary'}" href="laboratorios.html">
                        <i class="fas fa-door-open me-2"></i> Laboratorios
                    </a>
                </li>
                <li class="nav-item mb-2">
                    <a class="nav-link rounded-3 ${paginaActiva === 'ejecuciones' ? 'active shadow-sm' : 'text-secondary'}" href="ejecuciones.html">
                        <i class="fas fa-vial-circle-check me-2"></i> Ejecuciones
                    </a>
                </li>
                <li class="nav-item mb-2">
                    <a class="nav-link rounded-3 ${paginaActiva === 'protocolos' ? 'active shadow-sm' : 'text-secondary'}" href="protocolos.html">
                       <i class="fa-solid fa-book"></i>  Protocolos
                    </a>
                </li>
                <li class="nav-item mb-2 mt-3">
                    <p class="text-uppercase text-primary extra-small fw-bold px-3 mb-2" style="letter-spacing: 1px; font-size: 0.7rem;">
                        Sistema
                    </p>
                    <a class="nav-link rounded-3 ${paginaActiva === 'administracion' ? 'active shadow-sm' : 'text-secondary'}" href="admin.html">
                        <i class="fas fa-user-shield me-2"></i> Administración
                    </a>
                </li>
            </ul>

            <div class="sidebar-footer mt-auto p-4">
                <hr class="text-secondary opacity-25">
                <button class="btn btn-outline-danger w-100 rounded-pill btn-sm fw-bold" id="btn-logout">
                    <i class="fas fa-power-off me-2"></i> SALIR
                </button>
            </div>
        </div>
        `;

    // 2. LÓGICA DE CONTROLADOR (LOGOUT)
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
        try {
            const { logout } = await import('./controllers/authController.js');
            if (confirm("¿Cerrar sesión de administrador?")) {
                await logout();
                window.location.href = "login.html";
            }
        } catch (err) {
            console.error("Error al cerrar sesión:", err);
        }
    });

    // 3. INICIALIZACIÓN DINÁMICA DE BOOTSTRAP
    const menuElement = document.getElementById('sidebarMenu');
    if (menuElement && window.bootstrap) {
        new bootstrap.Collapse(menuElement, { toggle: false });
    }
}