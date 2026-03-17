import { auth } from "../models/firebase.js";
import { EjecucionModel } from "../models/EjecucionesModel.js";

export const EjecucionController = {
    adminId: null,
    materialesInventario: [],
    equiposInventario: [],
    editandoId: null,

    async init() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.adminId = user.uid;
                try {
                    await this.cargarDatosIniciales();
                    this.configurarEventos();
                    this.configurarFiltros();
                    await this.renderTablaEjecuciones();
                } catch (error) {
                    console.error("Error en Init:", error);
                }
            } else {
                window.location.href = "login.html";
            }
        });
    },

    async cargarDatosIniciales() {
        const [snapProt, snapMat, snapEq, snapTec] = await Promise.all([
            EjecucionModel.getColeccionPorAdmin("protocolos", this.adminId),
            EjecucionModel.getColeccionPorAdmin("inventario", this.adminId),
            EjecucionModel.getColeccionPorAdmin("equipos", this.adminId),
            EjecucionModel.getColeccionPorAdmin("usuarios", this.adminId)
        ]);

        this.materialesInventario = snapMat.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.equiposInventario = snapEq.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        this.renderSelects(snapProt, snapTec);
    },

    renderSelects(snapProt, snapTec) {
        const selProt = document.getElementById('ejProtocoloSel');
        if (selProt) {
            selProt.innerHTML = '<option value="">Seleccione Protocolo...</option>' +
                snapProt.docs.map(doc => `<option value="${doc.id}">${doc.data().nombre}</option>`).join('');
        }

        const selTec = document.getElementById('ejTecnico');
        if (selTec) {
            selTec.innerHTML = '<option value="">Seleccione Técnico...</option>' +
                snapTec.docs.map(doc => {
                    const d = doc.data();
                    return `<option value="${d.uid || doc.id}">${d.nombre || d.email || "Técnico sin nombre"}</option>`;
                }).join('');
        }
    },

    configurarEventos() {
        const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };

        bind('btn-agregar-material-ej', () => this.agregarFila('contenedor-materiales-ej', 'material'));
        bind('btnSaveEj', () => this.procesarGuardadoCompleto(false));
        bind('btnAsignarProtocolo', () => this.procesarGuardadoCompleto(true));

        const modalEj = document.getElementById('modalEj');
        if (modalEj) {
            modalEj.addEventListener('hidden.bs.modal', () => {
                this.editandoId = null;
                document.getElementById('form-ejecucion-registro').reset();
                document.getElementById('contenedor-materiales-ej').innerHTML = '';
            });
        }
    },

    // --- ACCIÓN: CANCELAR ---
    async cancelarTarea(id) {
        if (!confirm("¿Seguro que deseas CANCELAR? Se quitará de la App del técnico.")) return;
        try {
            // 1. Cambiamos estado en la maestra
            await EjecucionModel.cambiarEstadoEjecucion(id, "Cancelado");
            // 2. Borramos de asignaciones para el técnico
            await EjecucionModel.borrarAsignacion(id);
            alert("Tarea cancelada exitosamente.");
            await this.renderTablaEjecuciones(); // Recargar tabla sin refrescar toda la página
        } catch (e) {
            console.error(e);
            alert("Error al cancelar.");
        }
    },

    // --- ACCIÓN: BORRAR ---
    async borrarTarea(id) {
        if (!confirm("¿BORRAR PERMANENTEMENTE? No habrá vuelta atrás.")) return;
        try {
            await EjecucionModel.eliminarRegistro(id);
            alert("Registro eliminado por completo.");
            await this.renderTablaEjecuciones();
        } catch (e) {
            console.error(e);
            alert("Error al eliminar.");
        }
    },

    async renderTablaEjecuciones(filtro = "Todos") {
        const tbody = document.getElementById('lista-ej');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Actualizando...</td></tr>';

        try {
            const snap = await EjecucionModel.getEjecucionesFiltradas(this.adminId, filtro);
            if (snap.empty) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Sin actividad</td></tr>`;
                return;
            }

            tbody.innerHTML = snap.docs.map(doc => {
                const d = doc.data();
                const id = doc.id;

                // LÓGICA DE COLORES DE LOS BADGES
                let badgeColor = '';
                switch (d.estado) {
                    case 'Completado':
                        badgeColor = 'bg-success';
                        break;
                    case 'Cancelado':
                        badgeColor = 'bg-danger';  // ROJO
                        break;
                    case 'En Curso':
                        badgeColor = 'bg-primary';
                        break;
                    default:
                        badgeColor = 'bg-warning text-dark'; // Amarillo (text-dark para que se lea bien)
                        break;
                }

                return `
            <tr>
                <td><strong>${d.protocoloNombre || 'S/N'}</strong></td>
                <td>${d.tecnicoNombre || 'S/T'}</td>
                <td><span class="badge ${badgeColor}">${d.estado}</span></td>
                <td><small>${d.materialesUsados?.length || 0} items</small></td>
                <td class="text-end">
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="EjecucionController.prepararEdicion('${id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${(d.estado !== 'Completado' && d.estado !== 'Cancelado') ? `
                            <button class="btn btn-sm btn-outline-warning" onclick="EjecucionController.cancelarTarea('${id}')" title="Cancelar Tarea">
                                <i class="fas fa-times-circle"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-danger" onclick="EjecucionController.borrarTarea('${id}')" title="Eliminar Permanente">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
            }).join('');
        } catch (error) { console.error(error); }
    },

    async prepararEdicion(id) {
        try {
            const snap = await EjecucionModel.getDocById("ejecuciones", id);
            if (!snap.exists()) return;
            const d = snap.data();
            this.editandoId = id;

            document.getElementById('ejProtocoloSel').value = d.protocoloId;
            document.getElementById('ejTecnico').value = d.tecnicoId;
            document.getElementById('ejDesc').value = d.notas || "";
            document.getElementById('ejEstado').value = d.estado;

            const contenedor = document.getElementById('contenedor-materiales-ej');
            contenedor.innerHTML = "";
            if (d.materialesUsados) {
                d.materialesUsados.forEach(m => this.inyectarFilaConDatos('contenedor-materiales-ej', 'material', m));
            }

            new bootstrap.Modal(document.getElementById('modalEj')).show();
        } catch (error) { console.error(error); }
    },

    async procesarGuardadoCompleto(esAsignacionBtn) {
        const estadoFinal = esAsignacionBtn ? "Pendiente" : document.getElementById('ejEstado').value;
        const datos = this.prepararDatosFormulario(estadoFinal);
        if (!datos) return;

        try {
            if (this.editandoId) {
                await EjecucionModel.actualizarEjecucionCompleta(this.editandoId, datos);
                if (estadoFinal === "Pendiente") {
                    await EjecucionModel.actualizarAsignacion(this.editandoId, datos);
                } else {
                    await EjecucionModel.borrarAsignacion(this.editandoId);
                }
            } else {
                const docRef = await EjecucionModel.guardarRegistro(datos);
                if (estadoFinal === "Pendiente") {
                    await EjecucionModel.guardarAsignacion({ ...datos, ejecucionId: docRef.id });
                }
            }
            alert("Guardado exitoso");
            location.reload();
        } catch (error) { console.error(error); }
    },

    prepararDatosFormulario(estado) {
        const selProt = document.getElementById('ejProtocoloSel');
        const selTec = document.getElementById('ejTecnico');
        if (!selProt.value || !selTec.value) return alert("Faltan campos"), null;

        return {
            protocoloId: selProt.value,
            protocoloNombre: selProt.options[selProt.selectedIndex].text,
            tecnicoId: selTec.value,
            tecnicoNombre: selTec.options[selTec.selectedIndex].text,
            notas: document.getElementById('ejDesc').value,
            estado: estado,
            materialesUsados: this.obtenerDatosFilas('contenedor-materiales-ej'),
            adminId: this.adminId,
            fechaUltimaMod: new Date()
        };
    },

    agregarFila(contenedorId, tipo) {
        const contenedor = document.getElementById(contenedorId);
        const lista = tipo === 'material' ? this.materialesInventario : this.equiposInventario;
        const div = document.createElement('div');
        div.className = "fila-dinamica d-flex gap-2 mb-2";
        div.innerHTML = `
            <select class="form-select form-select-sm select-id">
                <option value="">-- Seleccionar --</option>
                ${lista.map(item => `<option value="${item.id}">${item.nombre}</option>`).join('')}
            </select>
            ${tipo === 'material' ? '<input type="number" class="form-control form-control-sm w-25 input-cant" placeholder="Cant.">' : ''}
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">×</button>
        `;
        contenedor.appendChild(div);
    },

    inyectarFilaConDatos(contenedorId, tipo, dataExistente) {
        this.agregarFila(contenedorId, tipo);
        const ultimaFila = document.getElementById(contenedorId).lastElementChild;
        ultimaFila.querySelector('.select-id').value = dataExistente.id;
        if (tipo === 'material') ultimaFila.querySelector('.input-cant').value = dataExistente.cant;
    },

    obtenerDatosFilas(contenedorId) {
        const filas = document.querySelectorAll(`#${contenedorId} .fila-dinamica`);
        return Array.from(filas).map(f => {
            const sel = f.querySelector('.select-id');
            return {
                id: sel.value,
                nombre: sel.options[sel.selectedIndex].text,
                cant: parseFloat(f.querySelector('.input-cant')?.value) || 1
            };
        }).filter(item => item.id !== "");
    },

    configurarFiltros() {
        document.querySelectorAll('input[name="filtroEstado"]').forEach(r => {
            r.addEventListener('change', (e) => this.renderTablaEjecuciones(e.target.value));
        });
    }
};

window.EjecucionController = EjecucionController;