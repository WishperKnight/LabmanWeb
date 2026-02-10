export const ReportesView = {
    renderTabla(reportes) {
        const cont = document.getElementById('lista-reportes');
        if (!cont) return;

        if (!reportes || reportes.length === 0) {
            cont.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted">No hay reportes registrados</td></tr>';
            return;
        }

        cont.innerHTML = reportes.map(r => {
            const esCerrado = r.estado === 'cerrado';
            const statusColor = esCerrado ? 'bg-secondary text-white' : 'bg-warning text-dark';

            return `
                <tr class="${esCerrado ? 'opacity-75 bg-light' : ''} align-middle">
                    <td class="ps-4 py-3">
                        <div class="fw-bold text-dark text-truncate" style="max-width: 150px;">${r.Momento}</div>
                        <small class="text-muted d-none d-sm-block text-truncate" style="max-width: 200px;">
                            ${r.Descripcion || ''}
                        </small>
                    </td>
                    <td class="d-none d-md-table-cell">
                        <span class="badge bg-primary-subtle text-primary rounded-pill px-3">${r.laboratorio || 'N/A'}</span>
                    </td>
                    <td class="d-none d-sm-table-cell">
                        <div class="small fw-semibold">${r.usuarioNombre || 'Sin asignar'}</div>
                    </td>
                    <td class="d-none d-lg-table-cell">
                        <span class="small text-muted">${r.FechaDeRegistro || ''}</span>
                    </td>
                    <td>
                        <select onchange="cambiarEstado('${r.id}', this.value)" 
                                class="form-select form-select-sm rounded-pill fw-bold ${statusColor}" 
                                style="min-width: 105px;">
                            <option value="abierto" ${r.estado === 'abierto' ? 'selected' : ''}>Abierto</option>
                            <option value="cerrado" ${r.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option>
                        </select>
                    </td>
                    <td class="text-end pe-4">
                        <div class="d-flex justify-content-end gap-1">
                            <button data-id="${r.id}" class="btn btn-sm btn-edit text-primary border-0 bg-transparent">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button data-id="${r.id}" class="btn btn-sm btn-delete text-danger border-0 bg-transparent">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    },

    renderDesplegables(labs, users) {
        const selLab = document.getElementById('rep-lab');
        const selUser = document.getElementById('rep-user');

        if (selLab) {
            selLab.innerHTML = '<option value="" disabled selected>Seleccione laboratorio...</option>' + 
                labs.map(l => `<option value="${l}">${l}</option>`).join('');
        }

        if (selUser) {
            selUser.innerHTML = '<option value="" disabled selected>Seleccione técnico...</option>' + 
                users.map(u => `<option value="${u}">${u}</option>`).join('');
        }
    }
};