import { db, auth } from '../models/firebase.js'; // Asegúrate de exportar auth desde tu firebase.js
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const protCollection = collection(db, "protocolos");
const invCollection = collection(db, "inventario"); 
const eqpCollection = collection(db, "equipos");

export const ProtocoloController = {
    itemsInventario: [],
    itemsEquipos: [],

    async init() {
        console.log("Iniciando ProtocoloController...");
        const tbody = document.getElementById('contenedor-protocolos');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>';

        try {
            const [snapProt, snapInv, snapEqp] = await Promise.all([
                getDocs(protCollection),
                getDocs(invCollection),
                getDocs(eqpCollection)
            ]);

            this.itemsInventario = snapInv.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.itemsEquipos = snapEqp.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const protocolos = snapProt.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderizarLista(protocolos);
            this.setupEventListeners();

        } catch (error) {
            console.error("Error en init:", error);
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar datos.</td></tr>';
        }
    },

    setupEventListeners() {
        document.getElementById('btn-add-equipo').onclick = () => this.agregarInputEquipo();
        document.getElementById('btn-add-fungible').onclick = () => this.agregarInputMaterial();

        document.getElementById('form-protocolo').onsubmit = async (e) => {
            e.preventDefault();
            await this.guardarProtocolo();
        };
    },

    agregarInputEquipo(seleccionado = "") {
        const container = document.getElementById('lista-equipos-input');
        const div = document.createElement('div');
        div.className = "input-group mb-2 equipo-item";
        
        const opciones = this.itemsEquipos.map(e => `
            <option value="${e.nombre}" ${e.nombre === seleccionado ? 'selected' : ''}>${e.nombre}</option>
        `).join('');

        div.innerHTML = `
            <select class="form-select form-select-sm val-equipo" required>
                <option value="">Seleccionar Equipo...</option>
                ${opciones}
            </select>
            <button type="button" class="btn btn-outline-danger btn-sm" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(div);
    },

    agregarInputMaterial(nombreSel = "", cant = "") {
        const container = document.getElementById('lista-fungibles-input');
        const div = document.createElement('div');
        div.className = "row g-2 mb-2 material-item";

        const opciones = this.itemsInventario.map(m => `
            <option value="${m.nombre}" ${m.nombre === nombreSel ? 'selected' : ''}>${m.nombre}</option>
        `).join('');

        div.innerHTML = `
            <div class="col-7">
                <select class="form-select form-select-sm mat-nombre" required>
                    <option value="">Seleccionar Material...</option>
                    ${opciones}
                </select>
            </div>
            <div class="col-4">
                <input type="text" class="form-control form-control-sm mat-cant" value="${cant}" placeholder="Cant." required>
            </div>
            <div class="col-1 text-end">
                <button type="button" class="btn btn-sm text-danger mt-1" onclick="this.closest('.material-item').remove()"><i class="fas fa-trash"></i></button>
            </div>
        `;
        container.appendChild(div);
    },
    async prepararEdicion(id) {
        try {
            // 1. Buscar el protocolo en la lista local o en Firebase
            const querySnapshot = await getDocs(protCollection);
            const protocolos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const p = protocolos.find(item => item.id === id);
            
            if (!p) return;

            // 2. Limpiar el formulario y los contenedores dinámicos antes de cargar
            this.limpiarFormulario();

            // 3. Llenar campos básicos
            document.getElementById('prot-id').value = p.id;
            document.getElementById('prot-nombre').value = p.nombre;
            document.getElementById('prot-procedimiento').value = p.procedimiento;

            // 4. Reconstruir los inputs de EQUIPOS
            if (p.equipoBase && Array.isArray(p.equipoBase)) {
                p.equipoBase.forEach(nombreEquipo => {
                    this.agregarInputEquipo(nombreEquipo);
                });
            }

            // 5. Reconstruir los inputs de FUNGIBLES
            if (p.materiales && Array.isArray(p.materiales)) {
                p.materiales.forEach(mat => {
                    this.agregarInputMaterial(mat.nombre_mat, mat.cant);
                });
            }

            // 6. Cambiar título del modal y mostrarlo
            document.getElementById('modal-titulo').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Protocolo';
            const modal = new bootstrap.Modal(document.getElementById('modalProtocolo'));
            modal.show();

        } catch (error) {
            console.error("Error al preparar edición:", error);
            alert("No se pudo cargar el protocolo para editar.");
        }
    },

    async guardarProtocolo() {
        try {
            // 1. Obtener el ID del Administrador actual
            const user = auth.currentUser;
            if (!user) {
                alert("Debes estar autenticado para realizar esta acción.");
                return;
            }

            const id = document.getElementById('prot-id').value;
            
            // 2. Captura de datos dinámicos
            const equipoBase = Array.from(document.querySelectorAll('.val-equipo'))
                                    .map(select => select.value)
                                    .filter(v => v !== "");

            const materiales = Array.from(document.querySelectorAll('.material-item'))
                                    .map(item => ({
                                        nombre_mat: item.querySelector('.mat-nombre').value,
                                        cant: item.querySelector('.mat-cant').value
                                    }))
                                    .filter(m => m.nombre_mat !== "");

            // 3. Crear el objeto de datos con adminId y Fecha Formateada
            const data = {
                nombre: document.getElementById('prot-nombre').value,
                procedimiento: document.getElementById('prot-procedimiento').value,
                equipoBase: equipoBase,
                materiales: materiales,
                adminId: user.uid, // Guardamos el UID del usuario logueado
                createdAt: this.obtenerFechaFormateada() 
            };

            // 4. Operación en Firebase
            if (id) {
                await updateDoc(doc(db, "protocolos", id), data);
            } else {
                await addDoc(protCollection, data);
            }

            // 5. Limpiar y Cerrar
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalProtocolo'));
            modal.hide();
            this.limpiarFormulario();
            await this.init(); 
            alert("¡Protocolo guardado con éxito!");

        } catch (error) {
            console.error("Error al guardar:", error);
            alert("No se pudo guardar: " + error.message);
        }
    },

    obtenerFechaFormateada() {
        const ahora = new Date();
        const opciones = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZoneName: 'short'
        };
        // Formato: 12 de febrero de 2026 a las 11:12:16 a.m. UTC+1
        return new Intl.DateTimeFormat('es-ES', opciones).format(ahora).replace(',', ' a las');
    },

    limpiarFormulario() {
        document.getElementById('form-protocolo').reset();
        document.getElementById('prot-id').value = '';
        document.getElementById('lista-equipos-input').innerHTML = '';
        document.getElementById('lista-fungibles-input').innerHTML = '';
    },

   renderizarLista(protocolos) {
    const tbody = document.getElementById('contenedor-protocolos'); 
    if (!tbody) return;

    tbody.innerHTML = protocolos.map(p => `
            <tr class="protocolo-row align-middle">
                <td class="ps-4 py-3" onclick="ProtocoloController.verDetalle('${p.id}')" style="cursor:pointer">
                    <div class="fw-bold text-dark">${p.nombre}</div>
                    <small class="text-muted">
                        <i class="fas fa-microscope me-1"></i>${p.equipoBase?.length || 0} eq. | 
                        <i class="fas fa-user-shield me-1"></i>ID: ${p.adminId?.substring(0,5)}
                    </small>
                </td>
                <td><span class="badge bg-primary-subtle text-primary border px-3">General</span></td>
                <td class="small text-muted">${p.createdAt || 'Sin fecha'}</td>
                <td class="pe-4 text-end">
                    <div class="btn-group shadow-sm bg-white rounded-pill p-1">
                        <button class="btn btn-link btn-sm text-danger" onclick="ProtocoloController.verDetalle('${p.id}')" title="Ver y Descargar PDF">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button class="btn btn-link btn-sm text-primary" onclick="ProtocoloController.prepararEdicion('${p.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-link btn-sm text-secondary" onclick="ProtocoloController.eliminar('${p.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

        async verDetalle(id) {
        // 1. Intentar buscar en la lista que ya cargamos para no llamar a Firebase otra vez
        // (Asegúrate de guardar la lista en this durante el init)
        const snap = await getDocs(protCollection);
        const p = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).find(item => item.id === id);
        
        if (!p) return;

        // 2. Llenar encabezados
        document.getElementById('view-nombre').innerText = p.nombre;
        document.getElementById('view-fecha').innerText = p.createdAt || 'Fecha no registrada';
        document.getElementById('view-admin').innerText = p.adminId ? `Admin ID: ${p.adminId}` : 'Sistema';

        // 3. Llenar Procedimiento (respetando los saltos de línea)
        const procElement = document.getElementById('view-procedimiento');
        procElement.innerText = p.procedimiento;

        // 4. Llenar Equipos (con iconos o formato de lista)
        const eqElement = document.getElementById('view-equipo');
        eqElement.innerHTML = p.equipoBase && p.equipoBase.length > 0 
            ? p.equipoBase.map(eq => `<span class="badge bg-light text-dark border me-1">${eq}</span>`).join('')
            : '<span class="text-muted">No requiere equipos específicos.</span>';
        
        // 5. Llenar Materiales (Fungibles)
        const matLista = document.getElementById('view-materiales-lista');
        matLista.innerHTML = p.materiales && p.materiales.length > 0
            ? p.materiales.map(m => `
                <div class="d-flex justify-content-between border-bottom py-1 small">
                    <span>${m.nombre_mat}</span>
                    <span class="fw-bold">Cant: ${m.cant}</span>
                </div>
            `).join('')
            : '<div class="text-muted small">Sin materiales registrados.</div>';

        // 6. Mostrar el modal
        const modalVer = new bootstrap.Modal(document.getElementById('modalVerDetalles'));
        modalVer.show();
    },
    exportarPDF() {
    // 1. Verificar si la librería se cargó correctamente
    if (typeof html2pdf === 'undefined') {
        alert("La librería de exportación aún no se ha cargado. Por favor, espera un momento o revisa tu conexión.");
        return;
    }

    const elemento = document.getElementById('area-impresion');
    const nombreDoc = document.getElementById('view-nombre').innerText || 'Protocolo';

    const opciones = {
        margin:       [10, 10, 10, 10], // márgenes en mm
        filename:     `${nombreDoc}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, logging: false, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Ejecutar la exportación
    html2pdf().set(opciones).from(elemento).save()
        .then(() => console.log("PDF generado con éxito"))
        .catch(err => console.error("Error al generar PDF:", err));
},
    async eliminar(id) {
        if (confirm("¿Eliminar este protocolo permanentemente?")) {
            await deleteDoc(doc(db, "protocolos", id));
            this.init();
        }
    }
};
window.ProtocoloController = ProtocoloController;