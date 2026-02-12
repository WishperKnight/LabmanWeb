import { auth } from "../models/firebase.js";
import { EjecucionModel } from "../models/EjecucionesModel.js";

export const EjecucionController = {
    adminId: null,
    materialesInventario: [],
    equiposInventario: [],

    async init() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.adminId = user.uid;
                try {
                    await this.cargarDatosIniciales();
                    this.configurarEventos();
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
                    return `<option value="${doc.id}">${d.nombre || d.email}</option>`;
                }).join('');
        }
    },

    configurarEventos() {
        const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = fn; };

        bind('btn-agregar-material-base', () => this.agregarFila('contenedor-materiales-base', 'material'));
        bind('btn-agregar-equipo-base', () => this.agregarFila('contenedor-equipos-base', 'equipo'));
        bind('btn-agregar-material-ej', () => this.agregarFila('contenedor-materiales-ej', 'material'));

        bind('btnGuardarProtBase', async () => {
            const datos = {
                nombre: document.getElementById('protNombre').value,
                procedimiento: document.getElementById('protDesc').value,
                equipos: this.obtenerDatosFilas('contenedor-equipos-base'),
                materiales: this.obtenerDatosFilas('contenedor-materiales-base'),
                adminId: this.adminId
            };
            await EjecucionModel.guardarProtocoloBase(datos);
            location.reload();
        });

        bind('btnSaveEj', () => this.enviarRegistro(false));
        bind('btnAsignarProtocolo', () => this.enviarRegistro(true));
    },

    agregarFila(contenedorId, tipo) {
        const contenedor = document.getElementById(contenedorId);
        const lista = tipo === 'material' ? this.materialesInventario : this.equiposInventario;
        
        const div = document.createElement('div');
        div.className = "fila-dinamica d-flex gap-2 mb-2";
        div.innerHTML = `
            <select class="form-select form-select-sm select-id">
                <option value="">-- ${tipo.toUpperCase()} --</option>
                ${lista.map(item => `<option value="${item.id}">${item.nombre}</option>`).join('')}
            </select>
            ${tipo === 'material' ? '<input type="number" class="form-control form-control-sm w-25 input-cant" placeholder="Cant.">' : ''}
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">×</button>
        `;
        contenedor.appendChild(div);
        if (contenedor.querySelector('p')) contenedor.querySelector('p').classList.add('d-none');
    },

    obtenerDatosFilas(contenedorId) {
        const filas = document.querySelectorAll(`#${contenedorId} .fila-dinamica`);
        return Array.from(filas).map(f => {
            const select = f.querySelector('.select-id');
            return {
                id: select.value,
                nombre: select.options[select.selectedIndex].text,
                cant: parseFloat(f.querySelector('.input-cant')?.value) || 1
            };
        }).filter(item => item.id !== "" && !item.nombre.includes("--"));
    },

    async renderTablaEjecuciones() {
        const tbody = document.getElementById('lista-ej');
        if (!tbody) return;

        const snap = await EjecucionModel.getColeccionPorAdmin("ejecuciones", this.adminId);
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">No hay actividad</td></tr>';
            return;
        }

        tbody.innerHTML = snap.docs.map(doc => {
            const d = doc.data();
            const id = doc.id;
            let badgeColor = d.estado === 'Completado' ? 'bg-success' : (d.estado === 'Cancelado' ? 'bg-danger' : 'bg-warning');
            
            return `
                <tr>
                    <td><strong>${d.protocoloNombre}</strong></td>
                    <td>${d.tecnicoNombre}</td>
                    <td><small class="text-muted">${d.estado === 'Pendiente' ? 'Asignada' : 'En uso'}</small></td>
                    <td><span class="badge ${badgeColor}">${d.estado}</span></td>
                    <td class="text-end">
                        <div class="btn-group shadow-sm">
                            <button class="btn btn-sm btn-outline-success" onclick="EjecucionController.cambiarEstado('${id}', 'Completado')" title="Finalizar y Restar Stock">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="EjecucionController.cambiarEstado('${id}', 'Cancelado')" title="Cancelar">
                                <i class="fas fa-ban"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async enviarRegistro(esAsignacion) {
        const selProt = document.getElementById('ejProtocoloSel');
        const selTec = document.getElementById('ejTecnico');
        
        const datos = {
            protocoloId: selProt.value,
            protocoloNombre: selProt.options[selProt.selectedIndex].text,
            tecnicoId: selTec.value,
            tecnicoNombre: selTec.options[selTec.selectedIndex].text,
            notas: document.getElementById('ejDesc').value,
            estado: esAsignacion ? "Pendiente" : "En Curso",
            materialesUsados: this.obtenerDatosFilas('contenedor-materiales-ej'),
            adminId: this.adminId
        };

        await EjecucionModel.guardarRegistro(datos);
        location.reload();
    },

    // LÓGICA DE ESTADOS Y STOCK
   async cambiarEstado(id, nuevoEstado) {
        if (!confirm(`¿Confirmar estado: ${nuevoEstado}?`)) return;

        try {
            // 1. Obtener los datos de la ejecución
            const snap = await EjecucionModel.getDocById("ejecuciones", id);
            if (!snap.exists()) throw new Error("La ejecución no existe.");
            
            const data = snap.data();

            // 2. Solo restamos stock si el estado pasa a 'Completado' 
            // y si no estaba completado ya (para no restar doble)
            if (nuevoEstado === "Completado" && data.estado !== "Completado") {
                
                // Verificamos si hay materiales para procesar
                if (data.materialesUsados && data.materialesUsados.length > 0) {
                    console.log("Restando stock de:", data.materialesUsados);
                    
                    for (const mat of data.materialesUsados) {
                        if (mat.id) { // Solo si tiene un ID válido
                            await EjecucionModel.actualizarStockYHistorial(
                                mat.id, 
                                mat.cant, 
                                data.tecnicoNombre || "Sin nombre", 
                                data.protocoloNombre || "Protocolo"
                            );
                        }
                    }
                }
            }

            // 3. Cambiar el estado en la base de datos
            await EjecucionModel.cambiarEstadoEjecucion(id, nuevoEstado);
            
            alert("Operación exitosa.");
            location.reload();

        } catch (error) {
            console.error("Error detallado:", error);
            alert("Error: No se pudo actualizar el stock. Revisa que los materiales existan en el inventario.");
        }
    },

async init() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            this.adminId = user.uid;
            await this.cargarDatosIniciales();
            this.configurarEventos();
            this.configurarFiltros(); // <-- Nueva función
            await this.renderTablaEjecuciones(); 
        } else {
            window.location.href = "login.html";
        }
    });
},

configurarFiltros() {
    const radios = document.querySelectorAll('input[name="filtroEstado"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const estadoSeleccionado = e.target.value;
            this.renderTablaEjecuciones(estadoSeleccionado);
        });
    });
},

async renderTablaEjecuciones(filtro = "Todos") {
    const tbody = document.getElementById('lista-ej');
    if (!tbody) return;

    // Mostrar spinner mientras carga el filtro
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border spinner-border-sm"></div> Filtrando...</td></tr>';

    try {
        const snap = await EjecucionModel.getEjecucionesFiltradas(this.adminId, filtro);
        
        if (snap.empty) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No hay operaciones con estado: ${filtro}</td></tr>`;
            return;
        }

        tbody.innerHTML = snap.docs.map(doc => {
            const d = doc.data();
            const id = doc.id;
            let badgeColor = d.estado === 'Completado' ? 'bg-success' : (d.estado === 'Cancelado' ? 'bg-danger' : (d.estado === 'En Curso' ? 'bg-primary' : 'bg-warning'));
            
            return `
                <tr class="animate__animated animate__fadeIn">
                    <td><strong>${d.protocoloNombre}</strong></td>
                    <td>${d.tecnicoNombre}</td>
                    <td><small class="text-muted">${d.materialesUsados?.length || 0} insumos</small></td>
                    <td><span class="badge ${badgeColor}">${d.estado}</span></td>
                    <td class="text-end">
                        <div class="btn-group">
                            ${d.estado !== 'Completado' ? `
                                <button class="btn btn-sm btn-outline-success" onclick="EjecucionController.cambiarEstado('${id}', 'Completado')"><i class="fas fa-check"></i></button>
                                <button class="btn btn-sm btn-outline-danger" onclick="EjecucionController.cambiarEstado('${id}', 'Cancelado')"><i class="fas fa-ban"></i></button>
                            ` : '<button class="btn btn-sm btn-light" disabled><i class="fas fa-lock text-muted"></i></button>'}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error("Error al filtrar:", error);
    }
}
};

// EXPOSICIÓN GLOBAL PARA LOS BOTONES DE LA TABLA
window.EjecucionController = EjecucionController;