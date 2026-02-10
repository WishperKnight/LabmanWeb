import { InventarioModel } from '../models/InventarioModel.js';
import { InventarioView } from '../views/InventarioView.js';
import { auth } from '../config/firebase-config.js';

export const InventarioController = {
    datos: [],
    tipoFiltro: 'reactivo',

    init() {
        auth.onAuthStateChanged(user => {
            if (user) {
                // Suscripción a Firebase
                InventarioModel.suscribirseAInventario(user.uid, (data) => {
                    this.datos = data;
                    this.refrescarUI();
                });
            } else {
                window.location.href = 'login.html';
            }
        });
        this.configurarEventos();
    },

    refrescarUI(terminoBusqueda = "") {
        const filtrados = this.datos.filter(i => {
            const coincideTipo = i.tipo === this.tipoFiltro;
            const nombre = (i.nombre || "").toLowerCase();
            const lote = (i.lote || "").toLowerCase();
            const coincideBusqueda = nombre.includes(terminoBusqueda) || lote.includes(terminoBusqueda);
            return coincideTipo && coincideBusqueda;
        });
        
        InventarioView.renderizarTabla(filtrados, this.tipoFiltro);
    },

    configurarEventos() {
        // 1. Buscador
        document.getElementById('busqueda').addEventListener('input', (e) => {
            this.refrescarUI(e.target.value.toLowerCase());
        });

        // 2. Cambio de Tabs (Reactivos / Fungibles)
        document.getElementById('tab-reactivos').onclick = () => {
            this.tipoFiltro = 'reactivo';
            this.refrescarUI();
            InventarioView.toggleCampos('reactivo'); // Asegura que el modal cambie también
        };
        document.getElementById('tab-fungibles').onclick = () => {
            this.tipoFiltro = 'fungible';
            this.refrescarUI();
            InventarioView.toggleCampos('fungible');
        };

        // 3. Botón "Nuevo" (Limpiar modal)
        document.getElementById('btn-nuevo-articulo').onclick = () => {
            document.getElementById('form-articulo').reset();
            document.getElementById('art-id').value = "";
            InventarioView.toggleCampos(this.tipoFiltro);
            new bootstrap.Modal(document.getElementById('modalArticulo')).show();
        };

        // 4. Guardar / Actualizar (Captura todos los atributos)
        document.getElementById('form-articulo').onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('art-id').value;
            
            const data = {
                adminId: auth.currentUser.uid,
                nombre: document.getElementById('art-nombre').value,
                tipo: document.getElementById('art-tipo').value,
                marca_fabricante: document.getElementById('art-marca').value,
                cantidad_unidades: Number(document.getElementById('art-stock').value), // Es el %
                riqueza: document.getElementById('art-riqueza').value,
                molaridad: document.getElementById('art-molaridad').value,
                capacidad: document.getElementById('art-capacidad').value,
                lote: document.getElementById('art-lote').value,
                caducidad: document.getElementById('art-caducidad').value
            };

            await InventarioModel.guardar(data, id);
            bootstrap.Modal.getInstance(document.getElementById('modalArticulo')).hide();
        };

        // 5. Delegación de eventos para Editar y Eliminar
        document.addEventListener('click', async (e) => {
            // Eliminar
            if (e.target.closest('.delete-btn')) {
                const id = e.target.closest('.delete-btn').dataset.id;
                if (confirm("¿Seguro que quieres eliminar este elemento?")) {
                    await InventarioModel.eliminar(id);
                }
            }

            // Editar
            if (e.target.closest('.edit-btn')) {
                const id = e.target.closest('.edit-btn').dataset.id;
                const item = await InventarioModel.obtenerPorId(id);
                if (item) this.cargarDatosEnModal(item);
            }
        });

        // 6. Cambio de tipo dentro del modal
        document.getElementById('art-tipo').onchange = (e) => {
            InventarioView.toggleCampos(e.target.value);
        };
    },

    cargarDatosEnModal(item) {
        document.getElementById('art-id').value = item.id;
        document.getElementById('art-nombre').value = item.nombre;
        document.getElementById('art-tipo').value = item.tipo;
        document.getElementById('art-marca').value = item.marca_fabricante || "";
        document.getElementById('art-stock').value = item.cantidad_unidades || 0;
        document.getElementById('art-riqueza').value = item.riqueza || "";
        document.getElementById('art-molaridad').value = item.molaridad || "";
        document.getElementById('art-capacidad').value = item.capacidad || "";
        document.getElementById('art-lote').value = item.lote || "";
        document.getElementById('art-caducidad').value = item.caducidad || "";

        InventarioView.toggleCampos(item.tipo);
        new bootstrap.Modal(document.getElementById('modalArticulo')).show();
    }
};