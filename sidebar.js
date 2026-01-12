export function cargarSidebar(paginaActiva) {
    const sidebarHTML = `
    <div class="sidebar d-flex flex-column">
        <div class="text-center mb-4">
            <i class="fas fa-microscope fa-3x text-primary mb-2"></i>
            <h4 class="fw-bold text-white tracking-tight">LAB TRACK</h4>
            <hr class="border-secondary">
        </div>
        <nav class="nav flex-column gap-2 mb-auto">
            <a href="dashboard.html" class="nav-link d-flex align-items-center ${paginaActiva === 'dashboard' ? 'active' : ''}">
                <i class="fas fa-home me-3"></i> Dashboard
            </a>
            <a href="inventario.html" class="nav-link d-flex align-items-center ${paginaActiva === 'inventario' ? 'active' : ''}">
                <i class="fas fa-boxes me-3"></i> Inventario
            </a>
            <a href="equipos.html" class="nav-link d-flex align-items-center ${paginaActiva === 'equipos' ? 'active' : ''}">
                <i class="fas fa-flask me-3"></i> Equipos
            </a>
            <a href="ejecuciones.html" class="nav-link d-flex align-items-center ${paginaActiva === 'ejecuciones' ? 'active' : ''}">
                <i class="fas fa-play-circle me-3"></i> Ejecuciones
            </a>
            <a href="reportes.html" class="nav-link d-flex align-items-center ${paginaActiva === 'reportes' ? 'active' : ''}">
                <i class="fas fa-file-pdf me-3"></i> Reportes
            </a>
            <a href="laboratorios.html" class="nav-link d-flex align-items-center ${paginaActiva === 'laboratorios' ? 'active' : ''}">
                <i class="fas fa-door-open me-3"></i> <span>Laboratorios</span>
            </a>
            <a href="admin.html" class="nav-link d-flex align-items-center ${paginaActiva === 'admin' ? 'active' : ''}">
                <i class="fas fa-user-shield me-3"></i> Administración
            </a>
        </nav>
        <div class="mt-4 pt-4 border-top border-secondary">
            <button id="btnLogout" class="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center">
                <i class="fas fa-sign-out-alt me-2"></i> Cerrar Sesión
            </button>
        </div>
    </div>`;

    document.getElementById('sidebar-container').innerHTML = sidebarHTML;
}