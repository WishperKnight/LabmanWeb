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
        const contenedor = document.getElementById('contenedor-laboratorios');
        if (!contenedor) return;

        LaboratorioModel.suscribirLaboratorios(adminId, async (snap) => {
            try {
                // 1. Mapeamos los documentos a promesas de datos + conteo
                const promesasCarga = snap.docs.map(async (doc) => {
                    const data = doc.data();
                    const id = doc.id;
                    
                    // Consultamos el conteo de equipos para este laboratorio específico
                    const numEquipos = await LaboratorioModel.getCountEquipos(data.nombre, adminId);
                    
                    return { id, data, numEquipos };
                });

                // 2. Esperamos a que TODAS las consultas de conteo terminen
                const resultados = await Promise.all(promesasCarga);

                // 3. RECIÉN AQUÍ limpiamos y dibujamos (evita parpadeos blancos largos)
                contenedor.innerHTML = ""; 

                if (resultados.length === 0) {
                    contenedor.innerHTML = `<div class="col-12 text-center text-muted py-5">
                        <i class="fas fa-flask fa-3x mb-3"></i><p>No hay laboratorios registrados.</p>
                    </div>`;
                    return;
                }

                resultados.forEach(res => {
                    this.dibujarTarjeta(res.id, res.data, res.numEquipos);
                });

                // Re-vincular eventos si tus botones (editar/eliminar) los necesitan
                this.vincularEventosTarjetas();

            } catch (error) {
                console.error("Error al procesar cambios en laboratorios:", error);
            }
        });
    },

    dibujarTarjeta(id, data, numEquipos) {
    const contenedor = document.getElementById('contenedor-laboratorios');
    const infoString = JSON.stringify(data).replace(/'/g, "&apos;");
    
    // Validación de seguridad: si numEquipos no viene, intentamos sacarlo de data
    const totalEquipos = numEquipos || (data.equipoBase ? data.equipoBase.length : 0);

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
                        <span class="badge bg-primary rounded-pill">${totalEquipos} unidades</span>
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
    },
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
    const estadoVacio = document.getElementById('estado-vacio-equipos');
    if (!tabla) return;

    // 1. Manejo de estado vacío
    if (snapshot.empty) {
        tabla.innerHTML = '';
        if (estadoVacio) estadoVacio.classList.remove('d-none');
        return;
    }

    if (estadoVacio) estadoVacio.classList.add('d-none');

    // 2. Construcción eficiente del HTML
    const filasHTML = snapshot.docs.map(doc => {
        const eq = doc.data();
        
        // Lógica de colores para el estado
        const badgeClass = eq.estado === 'Operativo' 
            ? 'bg-success-subtle text-success border-success' 
            : 'bg-danger-subtle text-danger border-danger';

        return `
            <tr>
                <td class="ps-4 py-3">
                    <div class="d-flex align-items-center">
                        <div class="bg-light rounded p-2 me-3 text-primary shadow-sm" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-tools small"></i>
                        </div>
                        <div>
                            <div class="fw-bold text-dark mb-0">${eq.nombre}</div>
                            <small class="text-muted text-uppercase" style="font-size: 0.7rem; letter-spacing: 0.5px;">
                                ${eq.marca || 'Genérico'} ${eq.modelo ? '• ' + eq.modelo : ''}
                            </small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge rounded-pill ${badgeClass} border px-3" style="font-weight: 600; font-size: 0.75rem;">
                        <i class="fas fa-circle me-1" style="font-size: 0.5rem;"></i> ${eq.estado}
                    </span>
                </td>
                <td class="pe-4 text-end">
                    <span class="font-monospace text-secondary small bg-light px-2 py-1 rounded border">
                        ${eq.serial || 'S/N'}
                    </span>
                </td>
            </tr>`;
    }).join('');

    // 3. Inyección única al DOM
    tabla.innerHTML = filasHTML;
}
};