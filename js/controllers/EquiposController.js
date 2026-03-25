import { EquiposModel } from '../models/EquiposModel.js';
import { auth, db } from '../config/firebase-config.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const EquiposController = {
    datos: [],
    paginaActual: 1,
    registrosPorPagina: 10,
    modalInstance: null,

    init() {
        this.modalInstance = new bootstrap.Modal(document.getElementById('modalEquipo'));
        
        auth.onAuthStateChanged(user => {
            if (user) {
                // Suscripción en tiempo real a Equipos
                EquiposModel.suscribirseAEquipos(user.uid, (data) => {
                    this.datos = data.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
                    this.render();
                });
                // Cargar sedes en el select del modal
                this.cargarSedes(user.uid);
            } else {
                window.location.href = 'login.html';
            }
        });
        this.configurarEventos();
        window.descargarPlantillaEquipos = () => this.descargarPlantilla();
    },

    configurarEventos() {
        // Delegación de clics para la tabla (Editar/Eliminar)
        document.getElementById('lista-equipos').addEventListener('click', (e) => {
            const btnEliminar = e.target.closest('.delete-btn');
            const btnEditar = e.target.closest('.edit-btn');

            if (btnEliminar) {
                const { id, nombre } = btnEliminar.dataset;
                if (confirm(`¿Eliminar ${nombre}?`)) EquiposModel.eliminar(id);
            }

            if (btnEditar) {
                this.prepararEdicion(btnEditar.dataset.id);
            }
        });

        // Abrir modal para nuevo equipo
        document.getElementById('btn-abrir-modal').onclick = () => {
            document.getElementById('form-equipo').reset();
            document.getElementById('eq-id').value = "";
            document.getElementById('modal-titulo').innerText = "Nuevo Registro Técnico";
            this.modalInstance.show();
        };

        // Guardar o Actualizar Formulario
        document.getElementById('form-equipo').onsubmit = async (e) => {
            e.preventDefault();
            this.guardarFormulario();
        };

        // EVENTO: Importar CSV
        const inputCSV = document.getElementById('input-csv');
        if (inputCSV) {
            inputCSV.onchange = (e) => this.procesarCSV(e.target.files[0]);
        }
    },

    // --- LÓGICA DE IMPORTACIÓN ---

    async procesarCSV(archivo) {
        if (!archivo) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const contenido = e.target.result;
            const lineas = contenido.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            
            const encabezados = lineas[0].split(',').map(h => h.trim());
            let creados = 0;
            let errores = 0;

            for (let i = 1; i < lineas.length; i++) {
                const fila = lineas[i].split(',');
                if (fila.length < encabezados.length) continue;

                const equipo = {};
                encabezados.forEach((header, index) => {
                    equipo[header] = fila[index]?.trim() || "";
                });

                // Campos automáticos
                equipo.adminId = auth.currentUser.uid;
                equipo.fechaUpdate = new Date().toISOString();

                // Validación y formato
                if (!equipo.nombre) { errores++; continue; }
                equipo.stock = parseInt(equipo.stock) || 1;
                if (!equipo.estado) equipo.estado = "Operativo";

                try {
                    await EquiposModel.guardar(equipo, null); 
                    creados++;
                } catch (err) {
                    console.error("Error en fila " + i, err);
                    errores++;
                }
            }

            alert(`✅ Importación finalizada\n- Equipos creados: ${creados}\n- Errores: ${errores}`);
            document.getElementById('input-csv').value = ""; 
        };
        reader.readAsText(archivo, 'UTF-8');
    },

descargarPlantilla() {
    // Encabezados exactos según tu captura de Equipos
    const encabezados = "nombre,modelo,serial,fabricante,tipo,laboratorio,estado,observaciones\n";
    const ejemplo = "Espectrofotómetro,Gen5,SN-123,ThermoFisher,Centrifugación,Laboratorio de Anatomía,Operativo,Calibración al día";
    
    const blob = new Blob([encabezados + ejemplo], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "plantilla_EQUIPOS.csv";
    a.click();
},
async procesarCSV(archivo) {
    if (!archivo) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const lineas = e.target.result.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const encabezados = lineas[0].split(',').map(h => h.trim());

        // VALIDACIÓN ANTI-MEZCLA: Si el CSV tiene "molaridad" o "caducidad", es de Inventario
        if (encabezados.includes('caducidad') || encabezados.includes('molaridad')) {
            alert("❌ Error: Estás intentando subir un archivo de INVENTARIO en la sección de EQUIPOS.");
            return;
        }

        for (let i = 1; i < lineas.length; i++) {
            const valores = lineas[i].split(',');
            const equipo = {};
            encabezados.forEach((h, idx) => equipo[h] = valores[idx] || "");

            // Mapeo exacto a tu imagen de Firestore
            equipo.adminID = auth.currentUser.uid; // NOTA: 'D' mayúscula según tu imagen
            equipo.fechaUpdate = new Date().toISOString();
            
            await EquiposModel.guardar(equipo, null);
        }
        alert("Equipos importados con éxito");
    };
    reader.readAsText(archivo);
},
    // --- GESTIÓN DE DATOS ---

    async cargarSedes(userId) {
        const q = query(collection(db, "laboratorios"), where("adminId", "==", userId));
        onSnapshot(q, (snap) => {
            const select = document.getElementById('eq-lab');
            if (!select) return;
            select.innerHTML = '<option value="" disabled selected>Seleccionar sede...</option>';
            snap.forEach(d => {
                const sede = d.data().nombre;
                select.innerHTML += `<option value="${sede}">${sede}</option>`;
            });
        });
    },

    async guardarFormulario() {
        const id = document.getElementById('eq-id').value;
        const payload = {
            adminId: auth.currentUser.uid,
            nombre: document.getElementById('eq-nombre').value,
            modelo: document.getElementById('eq-modelo').value,
            stock: document.getElementById('eq-stock').value,
            serial: document.getElementById('eq-serial').value,
            fabricante: document.getElementById('eq-fabricante').value,
            tipo: document.getElementById('eq-tipo').value,
            laboratorio: document.getElementById('eq-lab').value,
            estado: document.getElementById('eq-estado').value,
            observaciones: document.getElementById('eq-obs').value,
            fechaUpdate: new Date().toISOString()
        };

        try {
            await EquiposModel.guardar(payload, id);
            this.modalInstance.hide();
        } catch (err) {
            alert("Error: " + err.message);
        }
    },

    prepararEdicion(id) {
        const equipo = this.datos.find(e => e.id === id);
        if (!equipo) return;

        document.getElementById('eq-id').value = id;
        document.getElementById('eq-nombre').value = equipo.nombre || "";
        document.getElementById('eq-modelo').value = equipo.modelo || "";
        document.getElementById('eq-stock').value = equipo.stock || "1";
        document.getElementById('eq-serial').value = equipo.serial || "";
        document.getElementById('eq-fabricante').value = equipo.fabricante || "";
        document.getElementById('eq-tipo').value = equipo.tipo || "Medición";
        document.getElementById('eq-lab').value = equipo.laboratorio || "";
        document.getElementById('eq-estado').value = equipo.estado || "Operativo";
        document.getElementById('eq-obs').value = equipo.observaciones || "";

        document.getElementById('modal-titulo').innerText = "Actualizar Ficha Técnica";
        this.modalInstance.show();
    },

    // --- RENDERIZADO ---

    render() {
        const cont = document.getElementById('lista-equipos');
        const total = this.datos.length;
        const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
        const fin = Math.min(inicio + this.registrosPorPagina, total);
        const items = this.datos.slice(inicio, fin);

        if (total === 0) {
            cont.innerHTML = '<tr><td colspan="6" class="text-center p-5 text-muted small">No hay equipos registrados.</td></tr>';
            return;
        }

        cont.innerHTML = items.map(e => {
            const statusClass = {
                'Operativo': 'bg-success-subtle text-success border-success',
                'Mantenimiento': 'bg-warning-subtle text-warning-emphasis border-warning',
                'Fuera de Servicio': 'bg-danger-subtle text-danger border-danger'
            }[e.estado] || 'bg-secondary-subtle';

            return `
                <tr class="align-middle border-bottom">
                    <td class="ps-4 py-3">
                        <div class="d-flex flex-column">
                            <span class="fw-bold text-primary">${e.nombre}</span>
                            <span class="text-muted small">${e.modelo || '-'}</span>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex flex-column">
                            <span class="badge bg-dark text-white mb-1 align-self-start" style="font-size:0.65rem">${e.serial || 'S/N'}</span>
                            <span class="text-muted small">${e.fabricante || '-'}</span>
                        </div>
                    </td>
                    <td>
                        <div class="d-flex flex-column">
                            <span class="badge bg-light text-dark border fw-medium mb-1 align-self-start">${e.tipo}</span>
                            <span class="small text-danger fw-bold"><i class="fas fa-boxes me-1"></i>Stock: ${e.stock}</span>
                        </div>
                    </td>
                    <td><div class="small text-muted"><i class="fas fa-map-marker-alt me-1"></i>${e.laboratorio}</div></td>
                    <td><span class="badge border badge-status rounded-pill ${statusClass}">${(e.estado || 'Operativo').toUpperCase()}</span></td>
                    <td class="text-end pe-4">
                        <div class="d-flex justify-content-end gap-1">
                            <button class="btn btn-action btn-light text-primary edit-btn" data-id="${e.id}"><i class="fas fa-pen fa-xs"></i></button>
                            <button class="btn btn-action btn-light text-danger delete-btn" data-id="${e.id}" data-nombre="${e.nombre}"><i class="fas fa-trash fa-xs"></i></button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

        this.renderPaginacion(total, inicio, fin);
    },

    renderPaginacion(total, inicio, fin) {
        document.getElementById('pag-inicio').innerText = total === 0 ? 0 : inicio + 1;
        document.getElementById('pag-fin').innerText = fin;
        document.getElementById('pag-total').innerText = total;

        const numPaginas = Math.ceil(total / this.registrosPorPagina);
        const nav = document.getElementById('controles-paginacion');
        nav.innerHTML = "";

        for (let i = 1; i <= numPaginas; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === this.paginaActual ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link border-0 rounded-pill mx-1" href="#">${i}</a>`;
            li.onclick = (e) => {
                e.preventDefault();
                this.paginaActual = i;
                this.render();
            };
            nav.appendChild(li);
        }
    }
};