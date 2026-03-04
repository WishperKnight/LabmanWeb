import { InventarioModel } from '../models/InventarioModel.js';
import { InventarioView } from '../views/InventarioView.js';
import { auth } from '../config/firebase-config.js';

export const InventarioController = {
    datos: [],
    tipoFiltro: 'reactivo',
    paginaActual: 1,
    filasPorPagina: 10,

    init() {
        auth.onAuthStateChanged(user => {
            if (user) {
                // Suscripción a Firebase
                InventarioModel.suscribirseAInventario(user.uid, (data) => {
                    this.datos = data; // Aquí llegan los datos
                    
                    // IMPORTANTE: Resetear a página 1 si es la primera carga o hay cambios
                    // Pero llamar a refrescarUI() SIEMPRE que lleguen datos nuevos
                    this.refrescarUI(document.getElementById('busqueda')?.value.toLowerCase() || "");
                });
            } else {
                window.location.href = 'login.html';
            }
        });
        this.configurarEventos();
    },

refrescarUI(terminoBusqueda = "") {
        // 1. Filtrado inicial
        const filtrados = this.datos.filter(i => {
            const coincideTipo = i.tipo === this.tipoFiltro;
            const nombre = (i.nombre || "").toLowerCase();
            const lote = (i.lote || "").toLowerCase();
            return coincideTipo && (nombre.includes(terminoBusqueda) || lote.includes(terminoBusqueda));
        });

        // 2. Lógica de Paginación
        const total = filtrados.length;
        let datosPaginados = filtrados;

        if (this.filasPorPagina !== "all") {
            const inicio = (this.paginaActual - 1) * this.filasPorPagina;
            const fin = inicio + parseInt(this.filasPorPagina);
            datosPaginados = filtrados.slice(inicio, fin);
        }

        // 3. Renderizar Tabla y Contador
        InventarioView.renderizarTabla(datosPaginados, this.tipoFiltro);
        document.getElementById('pag-total').innerText = total;

        // 4. Renderizar Botones de Paginación
        this.renderizarControlesPaginacion(total);
    },

    renderizarControlesPaginacion(totalElementos) {
        const contenedor = document.getElementById('controles-paginacion');
        if (!contenedor) return;
        contenedor.innerHTML = "";

        if (this.filasPorPagina === "all" || totalElementos <= this.filasPorPagina) return;

        const totalPaginas = Math.ceil(totalElementos / this.filasPorPagina);

        for (let i = 1; i <= totalPaginas; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${this.paginaActual === i ? 'active' : ''}`;
            li.innerHTML = `<button class="page-link border-0 shadow-sm rounded-2 mx-1">${i}</button>`;
            li.onclick = () => {
                this.paginaActual = i;
                this.refrescarUI(document.getElementById('busqueda').value.toLowerCase());
            };
            contenedor.appendChild(li);
        }
    },

 async cargarLaboratoriosSelect() {
    const selectLab = document.getElementById('art-laboratorio');
    if (!selectLab) return;

    // Verificamos si hay un usuario autenticado
    const usuarioActual = auth.currentUser;
    if (!usuarioActual) {
        console.warn("No hay un usuario autenticado detectado todavía.");
        selectLab.innerHTML = '<option value="">Cargando sesión...</option>';
        return;
    }

    try {
        // Usamos la constante usuarioActual que ya verificamos que no es null
        const snap = await InventarioModel.obtenerLaboratorios(usuarioActual.uid);
        
        let opciones = '<option value="" disabled selected>Seleccione un laboratorio</option>';
        
        // Si no hay laboratorios creados aún
        if (snap.empty) {
            opciones = '<option value="" disabled selected>No tienes laboratorios creados</option>';
        } else {
            snap.forEach(doc => {
                const lab = doc.data();
                opciones += `<option value="${lab.nombre}">${lab.nombre}</option>`;
            });
        }

        selectLab.innerHTML = opciones;
    } catch (error) {
        console.error("Error al cargar laboratorios en el select:", error);
        selectLab.innerHTML = '<option value="">Error al cargar datos</option>';
    }
},

    configurarEventos() {
        // 1. Buscador dinámico
        const inputBusqueda = document.getElementById('busqueda');
        if (inputBusqueda) {
            inputBusqueda.addEventListener('input', (e) => {
                this.refrescarUI(e.target.value.toLowerCase());
            });
        }

        // 2. Gestión de Tabs (Reactivos / Fungibles)
        const tabReactivos = document.getElementById('tab-reactivos');
        const tabFungibles = document.getElementById('tab-fungibles');

        if (tabReactivos && tabFungibles) {
            tabReactivos.onclick = () => {
                this.tipoFiltro = 'reactivo';
                this.actualizarEstadoTabs(tabReactivos, tabFungibles);
                this.refrescarUI();
                InventarioView.toggleCampos('reactivo');
            };

            tabFungibles.onclick = () => {
                this.tipoFiltro = 'fungible';
                this.actualizarEstadoTabs(tabFungibles, tabReactivos);
                this.refrescarUI();
                InventarioView.toggleCampos('fungible');
            };
        }

        // 3. Botón "Nuevo Registro"
        const btnNuevo = document.getElementById('btn-nuevo-articulo');
        if (btnNuevo) {
            btnNuevo.onclick = async () => {
                document.getElementById('form-articulo').reset();
                document.getElementById('art-id').value = "";
                
                // Cargamos laboratorios antes de mostrar el modal
                await this.cargarLaboratoriosSelect();
                
                InventarioView.toggleCampos(this.tipoFiltro);
                const modal = new bootstrap.Modal(document.getElementById('modalArticulo'));
                modal.show();
            };
        }

        // 4. Formulario Guardar / Actualizar
        const formArticulo = document.getElementById('form-articulo');
        if (formArticulo) {
            formArticulo.onsubmit = async (e) => {
                e.preventDefault();
                const id = document.getElementById('art-id').value;

                const data = {
                    adminId: auth.currentUser.uid,
                    nombre: document.getElementById('art-nombre').value,
                    tipo: document.getElementById('art-tipo').value,
                    marca_fabricante: document.getElementById('art-marca').value,
                    cantidad_unidades: Number(document.getElementById('art-stock').value),
                    capacidad_total: document.getElementById('art-stockTotal').value,
                    riqueza: document.getElementById('art-riqueza').value,
                    molaridad: document.getElementById('art-molaridad').value,
                    capacidad_especifica: document.getElementById('art-capacidad').value,
                    lote: document.getElementById('art-lote').value,
                    fecha_recepcion: document.getElementById('art-recepcion').value,
                    caducidad: document.getElementById('art-caducidad').value,
                    laboratorio: document.getElementById('art-laboratorio').value
                };

                try {
                    await InventarioModel.guardar(data, id);
                    const modalEl = document.getElementById('modalArticulo');
                    const modalInst = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                    modalInst.hide();
                } catch (error) {
                    alert("Error al guardar: " + error.message);
                }
            };
        }

        // 5. Delegación de eventos para Editar y Eliminar
        document.addEventListener('click', async (e) => {
            // Botón Eliminar
            const btnDelete = e.target.closest('.delete-btn');
            if (btnDelete) {
                const id = btnDelete.dataset.id;
                if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
                    await InventarioModel.eliminar(id);
                }
            }

            // Botón Editar
            const btnEdit = e.target.closest('.edit-btn');
            if (btnEdit) {
                const id = btnEdit.dataset.id;
                const item = await InventarioModel.obtenerPorId(id);
                if (item) this.cargarDatosEnModal(item);
            }
        });

        // 6. Cambio de tipo dentro del propio modal
        const selectTipoModal = document.getElementById('art-tipo');
        if (selectTipoModal) {
            selectTipoModal.onchange = (e) => {
                InventarioView.toggleCampos(e.target.value);
            };
        }
        // 7. Evento para el nuevo selector de filas
        const selector = document.getElementById('selector-filas');
        if (selector) {
            selector.onchange = (e) => {
                this.filasPorPagina = e.target.value === "all" ? "all" : parseInt(e.target.value);
                this.paginaActual = 1; // Resetear a la primera página
                this.refrescarUI(document.getElementById('busqueda').value.toLowerCase());
            };
        }
    },

    async cargarDatosEnModal(item) {
        // Primero cargamos los laboratorios para asegurar que el select tenga opciones
        await this.cargarLaboratoriosSelect();

        document.getElementById('art-id').value = item.id || "";
        document.getElementById('art-nombre').value = item.nombre || "";
        document.getElementById('art-tipo').value = item.tipo || "reactivo";
        document.getElementById('art-marca').value = item.marca_fabricante || "";
        document.getElementById('art-stock').value = item.cantidad_unidades || 0;
        document.getElementById('art-stockTotal').value = item.capacidad_total || "";
        document.getElementById('art-riqueza').value = item.riqueza || "";
        document.getElementById('art-molaridad').value = item.molaridad || "";
        document.getElementById('art-capacidad').value = item.capacidad_especifica || "";
        document.getElementById('art-lote').value = item.lote || "";
        document.getElementById('art-recepcion').value = item.fecha_recepcion || "";
        document.getElementById('art-caducidad').value = item.caducidad || "";
        document.getElementById('art-laboratorio').value = item.laboratorio || "";

        InventarioView.toggleCampos(item.tipo);
        const modal = new bootstrap.Modal(document.getElementById('modalArticulo'));
        modal.show();
    },

    actualizarEstadoTabs(tabActiva, tabInactiva) {
        tabActiva.classList.add('active');
        tabInactiva.classList.remove('active');
        tabActiva.setAttribute('aria-selected', 'true');
        tabInactiva.setAttribute('aria-selected', 'false');
    }
};