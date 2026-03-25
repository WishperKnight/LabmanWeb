import { db, auth } from '../models/firebase.js';
import {
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const protCollection = collection(db, "protocolos");
const invCollection = collection(db, "inventario");
const eqpCollection = collection(db, "equipos");

export const ProtocoloController = {
    itemsInventario: [],
    itemsEquipos: [],
    usuarioActual: null,

    /**
     * Inicializa el controlador escuchando el estado de autenticación
     */
    init() {
        console.log("Iniciando ProtocoloController...");

        // El observador de Auth asegura que tengamos el UID antes de consultar Firestore
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.usuarioActual = user;
                await this.cargarDatosFiltrados();
                this.setupEventListeners();
            } else {
                console.warn("No hay sesión activa. Redirigiendo...");
                window.location.href = "login.html";
            }
        });
    },

    /**
     * Carga solo los datos que pertenecen al admin logueado
     */
    async cargarDatosFiltrados() {
        const tbody = document.getElementById('contenedor-protocolos');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';

        try {
            const adminId = this.usuarioActual.uid;

            // Consultas con filtro WHERE por adminId
            const qProt = query(protCollection, where("adminId", "==", adminId));
            const qInv = query(invCollection, where("adminId", "==", adminId));
            const qEqp = query(eqpCollection, where("adminId", "==", adminId));

            const [snapProt, snapInv, snapEqp] = await Promise.all([
                getDocs(qProt),
                getDocs(qInv),
                getDocs(qEqp)
            ]);

            // Almacenamos catálogos en memoria para búsquedas rápidas al guardar
            this.itemsInventario = snapInv.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.itemsEquipos = snapEqp.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const protocolos = snapProt.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            this.renderizarLista(protocolos);
        } catch (error) {
            console.error("Error al cargar datos:", error);
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error de permisos o conexión.</td></tr>';
        }
    },

    setupEventListeners() {
        // Botones para agregar filas dinámicas en el modal
        const btnAddEq = document.getElementById('btn-add-equipo');
        const btnAddMat = document.getElementById('btn-add-fungible');
        const form = document.getElementById('form-protocolo');

        if (btnAddEq) btnAddEq.onclick = () => this.agregarInputEquipo();
        if (btnAddMat) btnAddMat.onclick = () => this.agregarInputMaterial();

        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.guardarProtocolo();
            };
        }
    },

    // --- LÓGICA DE FORMULARIO DINÁMICO ---

    agregarInputEquipo(idSeleccionado = "") {
        const container = document.getElementById('lista-equipos-input');
        const div = document.createElement('div');
        div.className = "input-group mb-2 equipo-item animate__animated animate__fadeIn";

        const opciones = this.itemsEquipos.map(e => `
            <option value="${e.id}" ${e.id === idSeleccionado ? 'selected' : ''}>${e.nombre}</option>
        `).join('');

        div.innerHTML = `
            <select class="form-select form-select-sm val-equipo" required>
                <option value="">Seleccionar Equipo...</option>
                ${opciones}
            </select>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(div);
    },

    agregarInputMaterial(idSel = "", cant = "") {
        const container = document.getElementById('lista-fungibles-input');
        const div = document.createElement('div');
        div.className = "row g-2 mb-2 material-item animate__animated animate__fadeIn";

        const opciones = this.itemsInventario.map(m => `
            <option value="${m.id}" ${m.id === idSel ? 'selected' : ''}>${m.nombre}</option>
        `).join('');

        div.innerHTML = `
            <div class="col-7">
                <select class="form-select form-select-sm mat-id" required>
                    <option value="">Seleccionar Material...</option>
                    ${opciones}
                </select>
            </div>
            <div class="col-4">
                <input type="text" class="form-control form-control-sm mat-cant" value="${cant}" placeholder="Cant." required>
            </div>
            <div class="col-1 text-end">
                <button type="button" class="btn btn-sm text-danger mt-1" onclick="this.closest('.material-item').remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    },

    // --- ACCIONES DE FIRESTORE ---

    async guardarProtocolo() {
        try {
            const id = document.getElementById('prot-id').value;

            // Construcción del objeto equipoBase (buscando el objeto completo del catálogo filtrado)
            const equipoBase = Array.from(document.querySelectorAll('.val-equipo'))
                .map(select => this.itemsEquipos.find(e => e.id === select.value))
                .filter(v => v != null);

            // Construcción del objeto materiales (incluyendo cantidad del input)
            const materiales = Array.from(document.querySelectorAll('.material-item'))
                .map(item => {
                    const idMat = item.querySelector('.mat-id').value;
                    const itemFull = this.itemsInventario.find(m => m.id === idMat);
                    return itemFull ? { ...itemFull, cant: item.querySelector('.mat-cant').value } : null;
                })
                .filter(m => m != null);

            const data = {
                nombre: document.getElementById('prot-nombre').value,
                procedimiento: document.getElementById('prot-procedimiento').value,
                equipoBase: equipoBase,
                materiales: materiales,
                adminId: this.usuarioActual.uid, // Vínculo de propiedad
                lastUpdate: new Date()
            };

            if (id) {
                await updateDoc(doc(db, "protocolos", id), data);
            } else {
                data.createdAt = new Date();
                await addDoc(protCollection, data);
            }

            // Cerrar modal y refrescar
            const modalEl = document.getElementById('modalProtocolo');
            bootstrap.Modal.getInstance(modalEl).hide();

            this.limpiarFormulario();
            await this.cargarDatosFiltrados();
            alert("Protocolo guardado.");

        } catch (error) {
            console.error("Error al guardar:", error);
            alert("No se pudo guardar el protocolo.");
        }
    },

    async eliminar(id) {
        if (confirm("¿Estás seguro de eliminar este protocolo?")) {
            try {
                await deleteDoc(doc(db, "protocolos", id));
                await this.cargarDatosFiltrados();
            } catch (error) {
                alert("Error al eliminar. Verifica tus permisos.");
            }
        }
    },

    // --- VISTAS Y UTILIDADES ---

    renderizarLista(protocolos) {
    const tbody = document.getElementById('contenedor-protocolos');
    if (!tbody) {
        console.warn("No se encontró el contenedor-protocolos en el DOM.");
        return;
    }

    if (protocolos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No tienes protocolos registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = protocolos.map(p => {
        // --- LÓGICA DE FORMATEO DE FECHA RESISTENTE A ERRORES ---
        let fechaFormateada = "Sin fecha";

        if (p.createdAt) {
            try {
                let dateObj = null;

                // Caso 1: Es un Timestamp de Firebase (tiene el método toDate)
                if (p.createdAt && typeof p.createdAt.toDate === 'function') {
                    dateObj = p.createdAt.toDate();
                } 
                // Caso 2: Es un objeto Date, un Number o un String
                else {
                    dateObj = new Date(p.createdAt);
                }

                // Verificamos si la fecha es válida (getTime no devuelve NaN)
                if (dateObj && !isNaN(dateObj.getTime())) {
                    fechaFormateada = new Intl.DateTimeFormat('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }).format(dateObj);
                }
            } catch (e) {
                console.error(`Error procesando fecha para el protocolo ${p.id}:`, e);
                fechaFormateada = "Fecha inválida";
            }
        }

        return `
        <tr class="align-middle">
            <td class="ps-4" onclick="ProtocoloController.verDetalle('${p.id}')" style="cursor:pointer">
                <div class="fw-bold text-dark">${p.nombre || 'Sin nombre'}</div>
                <small class="text-muted">
                    <i class="fas fa-microscope me-1"></i>${p.equipoBase?.length || 0} eq. | 
                    <i class="fas fa-flask me-1"></i>${p.materiales?.length || 0} mat.
                </small>
            </td>
            <td><span class="badge bg-primary-subtle text-primary border px-3">General</span></td>
            <td class="small text-muted">${fechaFormateada}</td>
            <td class="pe-4 text-end">
                <div class="btn-group shadow-sm bg-white rounded-pill p-1">
                    <button class="btn btn-link btn-sm text-danger" title="Ver PDF" 
                            onclick="ProtocoloController.previsualizarPDF('${p.id}')">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                    <button class="btn btn-link btn-sm text-primary" title="Editar" 
                            onclick="ProtocoloController.prepararEdicion('${p.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-link btn-sm text-secondary" title="Eliminar" 
                            onclick="ProtocoloController.eliminar('${p.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
},


    async prepararEdicion(id) {
        // Buscamos en la colección pero asegurando el adminId
        const snap = await getDocs(query(protCollection, where("adminId", "==", this.usuarioActual.uid)));
        const p = snap.docs.map(d => ({ id: d.id, ...d.data() })).find(i => i.id === id);

        if (!p) return;

        this.limpiarFormulario();
        document.getElementById('prot-id').value = p.id;
        document.getElementById('prot-nombre').value = p.nombre;
        document.getElementById('prot-procedimiento').value = p.procedimiento;

        if (p.equipoBase) p.equipoBase.forEach(eq => this.agregarInputEquipo(eq.id));
        if (p.materiales) p.materiales.forEach(mat => this.agregarInputMaterial(mat.id, mat.cant));

        document.getElementById('modal-titulo').innerText = 'Editar Protocolo';
        new bootstrap.Modal(document.getElementById('modalProtocolo')).show();
    },

    limpiarFormulario() {
        const form = document.getElementById('form-protocolo');
        if (form) form.reset();
        document.getElementById('prot-id').value = '';
        document.getElementById('lista-equipos-input').innerHTML = '';
        document.getElementById('lista-fungibles-input').innerHTML = '';
    },

    obtenerFechaFormateada() {
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        }).format(new Date());
    },
    async exportarPDF(id) {
        // 1. Obtener los datos del protocolo (de la lista en memoria)
        const p = this.itemsInventario; // Si ya los tienes cargados, o búscalos:
        const protocolo = (await getDocs(query(protCollection, where("adminId", "==", this.usuarioActual.uid))))
            .docs.map(d => ({ id: d.id, ...d.data() })).find(item => item.id === id);

        if (!protocolo) return alert("No se pudo encontrar el protocolo para exportar.");

        // 2. Crear un elemento temporal fuera de la pantalla para el diseño del PDF
        const element = document.createElement('div');
        element.style.padding = '20px';
        element.style.fontFamily = 'Arial, sans-serif';

        // 3. Construir el HTML del documento PDF
        element.innerHTML = `
            <div style="border-bottom: 2px solid #007bff; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="color: #007bff; margin-bottom: 5px;">${protocolo.nombre}</h1>
                <p style="margin: 0; color: #666;">Fecha de registro: ${protocolo.createdAt || 'N/A'}</p>
                <p style="margin: 0; color: #666;">ID Administrador: ${protocolo.adminId}</p>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="color: #333; border-left: 5px solid #007bff; padding-left: 10px;">Procedimiento</h3>
                <p style="white-space: pre-line; line-height: 1.6;">${protocolo.procedimiento}</p>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="color: #333; border-left: 5px solid #007bff; padding-left: 10px;">Equipos Requeridos</h3>
                <ul>
                    ${protocolo.equipoBase?.map(eq => `<li>${eq.nombre}</li>`).join('') || '<li>No requiere equipos especiales.</li>'}
                </ul>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="color: #333; border-left: 5px solid #007bff; padding-left: 10px;">Materiales y Reactivos</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Material</th>
                            <th style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${protocolo.materiales?.map(m => `
                            <tr>
                                <td style="border: 1px solid #dee2e6; padding: 8px;">${m.nombre}</td>
                                <td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">${m.cant}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="2" style="text-align:center; padding:8px;">Sin materiales registrados.</td></tr>'}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #aaa;">
                Generado por LabMan System - ${new Date().toLocaleString()}
            </div>
        `;

        // 4. Configuración de la librería html2pdf
        const opciones = {
            margin: 1,
            filename: `Protocolo_${protocolo.nombre.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, logging: false, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // 5. Ejecutar generación y descarga
        html2pdf().set(opciones).from(element).save();
    },
    async previsualizarPDF(id) {
        // 1. Buscar el protocolo en los datos ya cargados
        const qProt = query(protCollection, where("adminId", "==", this.usuarioActual.uid));
        const snap = await getDocs(qProt);
        const protocolo = snap.docs.map(d => ({ id: d.id, ...d.data() })).find(p => p.id === id);

        if (!protocolo) return alert("Protocolo no encontrado.");

        // 2. Crear el contenedor del diseño (CSS en línea para el PDF)
        const element = document.createElement('div');
        element.style.padding = '40px';
        element.innerHTML = `
            <div style="border-bottom: 2px solid #0d6efd; margin-bottom: 20px;">
                <h1 style="color: #0d6efd;">${protocolo.nombre}</h1>
                <p><b>Fecha:</b> ${protocolo.createdAt || 'N/A'}</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h4 style="background: #f8f9fa; padding: 5px;">Procedimiento</h4>
                <p style="white-space: pre-line;">${protocolo.procedimiento}</p>
            </div>
            <div style="margin-bottom: 20px;">
                <h4 style="background: #f8f9fa; padding: 5px;">Equipos</h4>
                <ul>${protocolo.equipoBase?.map(e => `<li>${e.nombre}</li>`).join('') || '<li>Ninguno</li>'}</ul>
            </div>
            <div>
                <h4 style="background: #f8f9fa; padding: 5px;">Materiales</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead><tr style="border-bottom: 1px solid #ccc;"><th>Nombre</th><th>Cantidad</th></tr></thead>
                    <tbody>
                        ${protocolo.materiales?.map(m => `<tr><td>${m.nombre}</td><td style="text-align:center">${m.cant}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // 3. Generar el PDF como un BLOB (Internal Data)
        const opciones = {
            margin: 0.5,
            filename: 'previsualizacion.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Mostrar un spinner o mensaje de carga si lo deseas
        console.log("Generando previsualización...");

        html2pdf().set(opciones).from(element).outputPdf('bloburl').then((pdfUrl) => {
            // 4. Inyectar el PDF en el iframe del modal
            const iframe = document.getElementById('iframe-pdf');
            if (iframe) {
                iframe.src = pdfUrl;
                // Abrir el modal de Bootstrap
                const modalPreview = new bootstrap.Modal(document.getElementById('modalPreviewPDF'));
                modalPreview.show();
            }
        });
    },
};

// Exponer al objeto window para llamadas desde el HTML (onclick)
window.ProtocoloController = ProtocoloController;
window.printIframe = () => {
    const iframe = document.getElementById('iframe-pdf');
    if (iframe.src) {
        const win = window.open(iframe.src, '_blank');
        win.focus();
        win.print();
    }
};