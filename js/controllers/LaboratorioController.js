import { auth } from '../config/firebase-config.js';
import { LaboratorioModel } from '../models/LaboratorioModel.js';

export const LaboratorioController = {
    init() {
        auth.onAuthStateChanged(user => {
            if (user) {
                this.escucharCambios(user.uid);
                this.configurarEventos();
            } else {
                window.location.href = "login.html";
            }
        });
    },

    async escucharCambios(adminId) {
        LaboratorioModel.suscribirLaboratorios(adminId, async (snap) => {
            const contenedor = document.getElementById('contenedor-laboratorios');
            if (!contenedor) return;
            
            contenedor.innerHTML = ''; 

            if (snap.empty) {
                contenedor.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No hay unidades registradas.</p>
                    </div>`;
                return;
            }

            for (const doc of snap.docs) {
                const data = doc.data();
                const id = doc.id;
                const numEquipos = await LaboratorioModel.getCountEquipos(data.nombre, adminId);
                this.dibujarTarjeta(id, data, numEquipos);
            }
        });
    },

    dibujarTarjeta(id, data, numEquipos) {
        const contenedor = document.getElementById('contenedor-laboratorios');
        const infoString = JSON.stringify(data).replace(/'/g, "&apos;");

        contenedor.innerHTML += `
            <div class="col-md-4 mb-4">
                <div class="card card-premium shadow-sm border-0 p-3 h-100">
                    <div class="d-flex align-items-start justify-content-between mb-3">
                        <div class="d-flex align-items-center">
                            <div class="icon-box-lg bg-primary-subtle text-primary me-3">
                                <i class="fas fa-flask"></i>
                            </div>
                            <div>
                                <h6 class="fw-bold m-0 text-dark">${data.nombre || 'Sin nombre'}</h6>
                                <small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${data.ubicacion || 'N/A'}</small>
                            </div>
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-link text-muted p-0" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end shadow border-0">
                                <li><a class="dropdown-item btn-editar" href="#" data-id="${id}" data-info='${infoString}'><i class="fas fa-edit me-2"></i>Editar</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger btn-eliminar" href="#" data-id="${id}" data-nombre="${data.nombre}"><i class="fas fa-trash me-2"></i>Eliminar</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="bg-light rounded-3 p-3 mb-3">
                        <div class="d-flex justify-content-between mb-2">
                            <span class="small text-muted">Responsable:</span>
                            <span class="small fw-bold">${data.responsable || 'No asignado'}</span>
                        </div>
                        <div class="d-flex justify-content-between border-top pt-2 mt-2">
                            <span class="small text-muted font-bold">Equipos vinculados:</span>
                            <span class="badge bg-primary rounded-pill">${numEquipos} unidades</span>
                        </div>
                    </div>

                    <button class="btn btn-outline-primary w-100 rounded-pill btn-sm fw-bold btn-ver-inventario" data-nombre="${data.nombre}">
                        <i class="fas fa-list-check me-2"></i>Ver Detalles de Equipos
                    </button>
                </div>
            </div>`;
    },

    configurarEventos() {
        document.getElementById('btn-nueva-unidad')?.addEventListener('click', () => this.prepararModal());

        document.getElementById('form-lab').onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('lab-id').value;
            const datos = {
                adminId: auth.currentUser.uid,
                nombre: document.getElementById('lab-nombre').value,
                responsable: document.getElementById('lab-responsable').value,
                ubicacion: document.getElementById('lab-ubicacion').value,
                capacidad: document.getElementById('lab-capacidad').value,
                fechaModificacion: new Date().toISOString()
            };
            await LaboratorioModel.guardar(id, datos);
            bootstrap.Modal.getInstance(document.getElementById('modalLab')).hide();
        };

        document.addEventListener('click', async (e) => {
            const btnVer = e.target.closest('.btn-ver-inventario');
            const btnEditar = e.target.closest('.btn-editar');
            const btnEliminar = e.target.closest('.btn-eliminar');

            if (btnVer) {
                e.preventDefault();
                const nombreSede = btnVer.dataset.nombre;
                const snap = await LaboratorioModel.getEquiposPorLab(nombreSede, auth.currentUser.uid);
                this.renderizarEquiposModal(snap);
                new bootstrap.Modal(document.getElementById('modalVerEquipos')).show();
            }

            if (btnEditar) {
                e.preventDefault();
                this.prepararModal(btnEditar.dataset.id, JSON.parse(btnEditar.dataset.info));
            }

            if (btnEliminar) {
                e.preventDefault();
                if (confirm(`¿Eliminar ${btnEliminar.dataset.nombre}?`)) {
                    await LaboratorioModel.eliminar(btnEliminar.dataset.id);
                }
            }
        });
    }, // <-- Aquí faltaba cerrar la función configurarEventos

    async prepararModal(id = "", lab = {}) {
        const form = document.getElementById('form-lab');
        form.reset();
        document.getElementById('lab-id').value = id;
        document.getElementById('modal-titulo').innerText = id ? "Editar Unidad" : "Registrar Unidad";

        if (id) {
            document.getElementById('lab-nombre').value = lab.nombre || '';
            document.getElementById('lab-ubicacion').value = lab.ubicacion || '';
            document.getElementById('lab-capacidad').value = lab.capacidad || '';
        }

        const selectResp = document.getElementById('lab-responsable');
        const supSnap = await LaboratorioModel.getSupervisores(auth.currentUser.uid);
        
        selectResp.innerHTML = '<option value="" disabled selected>Seleccione responsable</option>';
        supSnap.forEach(doc => {
            const sup = doc.data();
            const selected = lab.responsable === sup.nombre ? 'selected' : '';
            selectResp.innerHTML += `<option value="${sup.nombre}" ${selected}>${sup.nombre}</option>`;
        });

        new bootstrap.Modal(document.getElementById('modalLab')).show();
    },

    renderizarEquiposModal(snapshot) {
        const tabla = document.getElementById('lista-equipos-lab');
        if (!tabla) return;
        tabla.innerHTML = snapshot.empty ? 
            '<tr><td colspan="3" class="text-center py-3">No hay equipos asociados.</td></tr>' : '';

        snapshot.forEach(doc => {
            const eq = doc.data();
            tabla.innerHTML += `
                <tr>
                    <td class="ps-4"><strong>${eq.nombre}</strong><br><small>${eq.marca || 'N/A'}</small></td>
                    <td><span class="badge ${eq.estado === 'Operativo' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill">${eq.estado}</span></td>
                    <td class="pe-4 text-end small">${eq.serial || 'S/N'}</td>
                </tr>`;
        });
    }
};