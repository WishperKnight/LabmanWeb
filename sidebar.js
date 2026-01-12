export function cargarSidebar(paginaActiva) {
    const sidebarHTML = `
    <div class="d-flex flex-column h-100 py-4 px-3" style="color: #ffffff;">
        <div class="mb-4 px-3">
            <h5 class="fw-bold mb-0" style="color: #ffffff;">
                <i class="fas fa-flask-vial me-2" style="color: #4f46e5;"></i>LAB TRACK
            </h5>
            <small style="color: #94a3b8; opacity: 0.8; font-size: 0.7rem;">SISTEMA DE GESTIÓN</small>
        </div>
        
        <nav class="nav flex-column gap-1">
            <a class="nav-link rounded-3 p-3 d-flex align-items-center ${paginaActiva === 'dashboard' ? 'active-link' : 'inactive-link'}" href="dashboard.html">
                <i class="fas fa-chart-pie me-3"></i> Dashboard
            </a>
            
            <a class="nav-link rounded-3 p-3 d-flex align-items-center ${paginaActiva === 'equipos' ? 'active-link' : 'inactive-link'}" href="equipos.html">
                <i class="fas fa-tools me-3"></i> Equipos
            </a>
            
            <a class="nav-link rounded-3 p-3 d-flex align-items-center ${paginaActiva === 'ejecuciones' ? 'active-link' : 'inactive-link'}" href="ejecuciones.html">
                <i class="fas fa-play-circle me-3"></i> Ejecuciones
            </a>
            
            <a class="nav-link rounded-3 p-3 d-flex align-items-center ${paginaActiva === 'reportes' ? 'active-link' : 'inactive-link'}" href="reportes.html">
                <i class="fas fa-file-medical-alt me-3"></i> Reportes
            </a>
            
            <a class="nav-link rounded-3 p-3 d-flex align-items-center ${paginaActiva === 'laboratorios' ? 'active-link' : 'inactive-link'}" href="laboratorios.html">
                <i class="fas fa-microscope me-3"></i> Laboratorios
            </a>
            
            <div class="my-2 border-top border-white border-opacity-10"></div>
            
            <a class="nav-link rounded-3 p-3 d-flex align-items-center ${paginaActiva === 'administracion' ? 'active-link' : 'inactive-link'}" href="admin.html">
                <i class="fas fa-user-shield me-3"></i> Administración
            </a>
        </nav>

        <div class="mt-auto px-3 pt-4">
            <a href="index.html" class="text-danger text-decoration-none small fw-bold d-flex align-items-center p-2 rounded-3 logout-link">
                <i class="fas fa-sign-out-alt me-2"></i> Cerrar Sesión
            </a>
        </div>
    </div>`;

    const container = document.getElementById('sidebar-container');
    if (container) {
        container.innerHTML = sidebarHTML;
    }
}