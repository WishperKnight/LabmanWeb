export const DashboardView = {
    actualizarContador(id, valor) {
        const el = document.getElementById(id);
        if (el) el.innerText = valor;
    },

    renderSedes(labs) {
        const cont = document.getElementById('tabla-labs');
        if (!cont) return;
        if (labs.length === 0) {
            cont.innerHTML = '<tr><td colspan="3" class="text-center py-3">No hay sedes.</td></tr>';
            return;
        }
        cont.innerHTML = labs.map(l => `
            <tr>
                <td class="fw-bold text-dark">${l.nombre || l.Nombre || 'Sin nombre'}</td>
                <td><div class="small">${l.responsable || 'Sin asignar'}</div></td>
                <td class="text-end">
                    <span class="badge bg-success-subtle text-success rounded-pill px-3">Operativa</span>
                </td>
            </tr>
        `).join('');
    },

    renderMantenimientos(incidencias) {
        const cont = document.getElementById('lista-incidencias');
        if (!cont) return;
        if (incidencias.length === 0) {
            cont.innerHTML = '<p class="text-muted small p-3 text-center">No hay mantenimientos pendientes.</p>';
            return;
        }
        cont.innerHTML = incidencias.map(i => `
            <div class="list-group-item border-0 px-0 py-3 border-bottom">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1 fw-bold small">${i.Momento || i.nombre || 'Incidencia'}</h6>
                        <p class="mb-0 text-muted extra-small">${i.laboratorio || 'Sede'} - ${i.FechaDeRegistro || ''}</p>
                    </div>
                    <span class="badge bg-danger-subtle text-danger rounded-pill">Abierto</span>
                </div>
            </div>
        `).join('');
    },

    renderAlertas(materiales) {
        const cont = document.getElementById('contenedor-alertas');
        if (!cont) return;
        if (materiales.length === 0) {
            cont.innerHTML = '<div class="text-center py-4"><p class="small text-muted">Stock optimo</p></div>';
            return;
        }
        cont.innerHTML = materiales.map(m => {
            const actual = m.cantidad_unidades || 0;
            const max = m.cantidad_maxima || 10;
            const porcentaje = (actual / max) * 100;
            return `
                <div class="mb-3 p-3 bg-light rounded-3 border-start border-warning border-4 shadow-sm">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="fw-bold small">${m.nombre}</span>
                        <span class="text-danger small fw-bold">${actual} / ${max}</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-warning" style="width: ${porcentaje}%"></div>
                    </div>
                </div>`;
        }).join('');
    },
    renderSedes(labs) {
        const cont = document.getElementById('tabla-labs'); 
        if (!cont) return;

        if (labs.length === 0) {
            cont.innerHTML = '<tr><td colspan="3" class="text-center py-3 text-muted">No hay laboratorios registrados</td></tr>';
            return;
        }

        cont.innerHTML = labs.map(l => `
            <tr>
                <td class="fw-bold text-dark">${l.nombre || 'Sin nombre'}</td>
                <td><div class="small text-muted">${l.responsable || 'Sin asignar'}</div></td>
                <td class="text-end">
                    <span class="badge bg-primary-subtle text-primary rounded-pill px-3">
                        ${l.ubicacion || 'Sede Central'}
                    </span>
                </td>
            </tr>
        `).join('');
    },

    renderAlertas(materiales) {
        const cont = document.getElementById('contenedor-alertas');
        if (!cont) return;

        if (materiales.length === 0) {
            cont.innerHTML = '<p class="text-muted small text-center py-4">Inventario saludable</p>';
            return;
        }

        cont.innerHTML = materiales.map(m => {
            const actual = m.cantidad_unidades || 0;
            const max = m.cantidad_maxima || 10;
            const porcentaje = (actual / max) * 100;
            return `
                <div class="mb-3 p-3 bg-light rounded-4 border-start border-warning border-4 shadow-sm">
                    <div class="d-flex justify-content-between mb-1">
                        <span class="fw-bold small">${m.nombre}</span>
                        <span class="text-danger small fw-bold">${actual} / ${max}</span>
                    </div>
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar bg-warning" style="width: ${porcentaje}%"></div>
                    </div>
                </div>`;
        }).join('');
    }
};