export const LaboratorioView = {
    renderListado(snap, totalEquiposMap) {
        const cont = document.getElementById('contenedor-laboratorios');
        cont.innerHTML = "";

        snap.forEach(d => {
            const lab = d.data();
            const id = d.id;
            const numEquipos = totalEquiposMap[lab.nombre] || 0;

            cont.innerHTML += `
                <div class="col-md-6 col-xl-4">
                    <div class="card-premium border-0 shadow-sm p-4 h-100">
                        <div class="d-flex justify-content-between mb-3">
                            <div class="icon-box-lg bg-primary-subtle text-primary"><i class="fas fa-building"></i></div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm btn-light rounded-circle btn-editar" data-id="${id}" data-info='${JSON.stringify(lab)}'>
                                    <i class="fas fa-pen text-primary"></i>
                                </button>
                                <button class="btn btn-sm btn-light rounded-circle btn-eliminar" data-id="${id}" data-nombre="${lab.nombre}">
                                    <i class="fas fa-trash text-danger"></i>
                                </button>
                            </div>
                        </div>
                        <h5 class="fw-bold mb-1">${lab.nombre}</h5>
                        <p class="text-muted small mb-3"><i class="fas fa-map-marker-alt text-primary"></i> ${lab.ubicacion || 'Sede principal'}</p>
                        <div class="bg-light rounded-4 p-3 d-flex justify-content-around mb-4 border border-white">
                            <div class="text-center">
                                <span class="d-block h5 fw-bold mb-0 text-primary">${numEquipos}</span>
                                <small class="text-muted fw-bold" style="font-size:0.6rem">EQUIPOS</small>
                            </div>
                            <div class="vr opacity-25"></div>
                            <div class="text-center">
                                <span class="d-block h5 fw-bold mb-0">${lab.capacidad}</span>
                                <small class="text-muted fw-bold" style="font-size:0.6rem">CUPO MÁX</small>
                            </div>
                        </div>
                        <button class="btn btn-primary w-100 rounded-pill fw-bold btn-sm py-2 btn-ver-inventario" data-nombre="${lab.nombre}">
                            <i class="fas fa-list-ul me-2"></i>Ver Inventario
                        </button>
                    </div>
                </div>`;
        });
    },

    renderSupervisores(snap) {
        const select = document.getElementById('lab-responsable');
        select.innerHTML = '<option value="" disabled selected>Seleccione un supervisor...</option>';
        snap.forEach(d => {
            const u = d.data();
            select.innerHTML += `<option value="${u.nombre}">${u.nombre}</option>`;
        });
    },

    renderEquiposModal(snap) {
        const cont = document.getElementById('lista-equipos-lab');
        cont.innerHTML = snap.empty ? `<tr><td colspan="3" class="text-center p-4">Sin activos.</td></tr>` : "";
        snap.forEach(d => {
            const e = d.data();
            cont.innerHTML += `
                <tr>
                    <td class="ps-4"><b>${e.nombre}</b></td>
                    <td><span class="badge bg-light text-dark border">${e.estado}</span></td>
                    <td class="pe-4 text-end small text-muted">${e.serial || 'S/N'}</td>
                </tr>`;
        });
    }
};