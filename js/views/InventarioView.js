export const InventarioView = {

    renderizarTabla(items, tipoActual) {
        const header = document.getElementById('encabezados-tabla');
        const tbody = document.getElementById('lista-materiales');

        // 1. Cabeceras Dinámicas basadas en tu captura de base de datos
        header.innerHTML = `
            <th class="ps-4">Producto / Marca</th>
            <th>Stock (%)</th>
            ${tipoActual === 'reactivo' ? 
                '<th>Riqueza</th><th>Molaridad</th>' : 
                '<th>Capacidad</th>'
            }
            <th>Lote / Caducidad</th>
            <th class="text-end pe-4">Acciones</th>
        `;

        tbody.innerHTML = "";

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No hay registros</td></tr>`;
            return;
        }

        items.forEach(item => {
            // Aseguramos que los valores numéricos existan
            const stock = Number(item.cantidad_unidades) || 0;
            
            // Lógica de colores según stock
            const statusClass = stock < 30 ? 'status-critical' : (stock <= 45 ? 'status-warning' : 'status-ok');
            const alertBadge = stock < 30 ? '<span class="badge bg-danger ms-2" style="font-size:0.6rem">PEDIR</span>' : '';
            
            // Lógica de caducidad
            const esCaducado = item.caducidad && new Date(item.caducidad) < new Date();

            tbody.innerHTML += `
                <tr>
                    <td class="ps-4">
                        <div class="d-flex align-items-center">
                            <span class="status-indicator ${statusClass}"></span>
                            <div>
                                <span class="fw-bold text-dark">${item.nombre}</span> ${alertBadge}<br>
                                <small class="text-muted">${item.marca_fabricante || 'Sin marca'}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex align-items-center" style="min-width: 120px">
                            <small class="me-2 fw-bold">${stock}%</small>
                            <div class="progress flex-grow-1" style="height: 6px;">
                                <div class="progress-bar ${stock < 30 ? 'bg-danger' : (stock <= 45 ? 'bg-warning' : 'bg-success')}" 
                                     style="width: ${stock}%"></div>
                            </div>
                        </div>
                    </td>
                    ${tipoActual === 'reactivo' ? 
                        `<td>${item.riqueza || '-'}%</td><td>${item.molaridad || '-'}M</td>` : 
                        `<td>${item.capacidad || '-'} ml/g</td>`
                    }
                    <td>
                        <div class="small"><b>Lote:</b> ${item.lote || '-'}</div>
                        <div class="small ${esCaducado ? 'text-danger fw-bold' : 'text-muted'}">
                            <b>Vence:</b> ${item.caducidad || 'S/F'}
                        </div>
                    </td>
                    <td class="text-end pe-4">
                        <button class="btn btn-sm btn-light text-primary btn-editar" data-id="${item.id}">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn btn-sm btn-light text-danger btn-eliminar" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    },

    // Esta función oculta o muestra campos en el MODAL según el tipo seleccionado
    toggleCampos(tipo) {
        // Seleccionamos los contenedores de los inputs por clase
        const camposReactivo = document.querySelectorAll('.campo-reactivo'); // Riqueza, Molaridad
        const camposFungible = document.querySelectorAll('.campo-equipo');    // Capacidad, Serial, etc.
        
        if (tipo === 'reactivo') {
            camposReactivo.forEach(el => el.classList.remove('d-none'));
            camposFungible.forEach(el => el.classList.add('d-none'));
        } else {
            camposReactivo.forEach(el => el.classList.add('d-none'));
            camposFungible.forEach(el => el.classList.remove('d-none'));
        }
    }
};