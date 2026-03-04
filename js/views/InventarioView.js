// InventarioView.js
export const InventarioView = {
    // InventarioView.js
    renderizarTabla(items, tipoFiltro) {
        const tbody = document.getElementById('lista-materiales');
        const thead = document.getElementById('encabezados-tabla');
        if (!tbody || !thead) return;

        // 1. Definir encabezados según el tipo
        if (tipoFiltro === 'fungible') {
            thead.innerHTML = `
                <th class="ps-4 py-3">Equipo / Material</th>
                <th>Stock Disponible</th>
                <th>Laboratorio</th>
                <th>Marca/Modelo</th>
                <th>Capacidad</th>
                <th class="pe-4 text-end">Acciones</th>
            `;
        } else {
            thead.innerHTML = `
                <th class="ps-4 py-3">Reactivo</th>
                <th>Nivel de Stock</th>
                <th>Ubicación</th>
                <th>Lote</th>
                <th>Caducidad</th>
                <th class="pe-4 text-end">Acciones</th>
            `;
        }

        // 2. Manejo de estado vacío
        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-5 text-muted">No hay registros en esta categoría.</td></tr>`;
            return;
        }

        // 3. Renderizar filas
        tbody.innerHTML = items.map(item => {
            let stockDisplay = '';
            
            if (tipoFiltro === 'fungible') {
                stockDisplay = `
                    <span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 rounded-pill">
                        <i class="fas fa-boxes me-1"></i> ${item.cantidad_unidades || 0} uds
                    </span>`;
            } else {
                const porcentaje = item.cantidad_unidades || 0;
                const color = porcentaje < 20 ? 'bg-danger' : (porcentaje < 50 ? 'bg-warning' : 'bg-success');
                stockDisplay = `
                    <div style="min-width: 100px;">
                        <div class="d-flex justify-content-between mb-1 small">
                            <span class="fw-bold">${porcentaje}%</span>
                        </div>
                        <div class="progress" style="height: 6px;">
                            <div class="progress-bar ${color}" style="width: ${porcentaje}%"></div>
                        </div>
                    </div>`;
            }

            return `
                <tr>
                    <td class="ps-4">
                        <div class="fw-bold text-dark">${item.nombre}</div>
                        <small class="text-muted">${item.marca_fabricante || 'N/A'}</small>
                    </td>
                    <td>${stockDisplay}</td>
                    <td><span class="badge bg-light text-dark border small">${item.laboratorio || 'N/A'}</span></td>
                    <td class="small">${tipoFiltro === 'fungible' ? (item.marca_fabricante || '-') : (item.lote || '-')}</td>
                    <td class="small">${tipoFiltro === 'fungible' ? (item.capacidad_especifica || '-') : (item.caducidad || '-')}</td>
                    <td class="pe-4 text-end">
                        <button class="btn btn-sm btn-light rounded-pill edit-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-light rounded-pill delete-btn text-danger" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    toggleCampos(tipo) {
        // Ajusta la visibilidad de los campos especiales en el modal
        const camposReactivo = document.querySelectorAll('.campo-reactivo');
        const camposFungible = document.querySelectorAll('.campo-fungible');
        const inputGroupText = document.querySelector('.input-group-text'); // El símbolo de %

        if (tipo === 'fungible') {
            camposReactivo.forEach(c => c.classList.add('d-none'));
            camposFungible.forEach(c => c.classList.remove('d-none'));
        } else {
            camposReactivo.forEach(c => c.classList.remove('d-none'));
            camposFungible.forEach(c => c.classList.add('d-none'));
        }
    }
};