import { ReportesModel } from '../models/ReportesModel.js';
import { ReportesView } from '../views/ReportesView.js';
import { auth } from '../config/firebase-config.js';
import { cargarSidebar } from '../sidebar.js';

export const ReportesController = {
    datos: [],
    filtroActual: 'todos',
    modal: null,

    async init() {
        // Inicializamos el modal de Bootstrap
        this.modal = new bootstrap.Modal(document.getElementById('modalReporte'));
        cargarSidebar('reportes');

        // Escuchamos el estado de la autenticación
        auth.onAuthStateChanged(user => {
            if (user) {
                // Suscripción en tiempo real al modelo
                ReportesModel.suscribirse(user.uid, (data) => {
                    this.datos = data;
                    this.render();
                });
            } else {
                window.location.href = "login.html";
            }
        });

        this.configurarEventos();
    },

    configurarEventos() {
        // Gestión de Filtros (UI)
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = (e) => {
                this.filtroActual = e.target.dataset.filter;
                // Cambiar clases visuales de los botones
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-light');
                });
                e.target.classList.remove('btn-light');
                e.target.classList.add('btn-primary');
                this.render();
            };
        });

        // Envío del Formulario (Guardar/Editar)
        document.getElementById('form-reporte').onsubmit = async (e) => {
            e.preventDefault();
            this.handleGuardar();
        };

        // Delegación de eventos para botones de la tabla (Editar/Eliminar)
        document.getElementById('lista-reportes').onclick = (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            
            const id = btn.dataset.id;
            if (btn.classList.contains('btn-delete')) this.handleEliminar(id);
            if (btn.classList.contains('btn-edit')) this.handleEditar(id);
        };
        
        // Botón para abrir formulario vacío
        document.getElementById('btn-nuevo-reporte').onclick = () => this.abrirModal();
    },

    async abrirModal() {
        // Cargamos los selectores de laboratorios y usuarios antes de mostrar
        const { labs, users } = await ReportesModel.obtenerDesplegables(auth.currentUser.uid);
        ReportesView.renderDesplegables(labs, users);
        
        document.getElementById('form-reporte').reset();
        document.getElementById('edit-id').value = "";
        document.getElementById('modalTitulo').innerText = "Nueva Incidencia";
        this.modal.show();
    },

    async handleEditar(id) {
        const r = this.datos.find(item => item.id === id);
        if (!r) return;

        // Cargamos desplegables primero
        const { labs, users } = await ReportesModel.obtenerDesplegables(auth.currentUser.uid);
        ReportesView.renderDesplegables(labs, users);

        // Llenamos el formulario con soporte para nombres antiguos y nuevos
        document.getElementById('edit-id').value = r.id;
        document.getElementById('rep-momento').value = r.titulo || r.Momento || "";
        document.getElementById('rep-lab').value = r.laboratorio || "";
        document.getElementById('rep-user').value = r.usuarioNombre || "";
        document.getElementById('rep-desc').value = r.descripcion || r.Descripcion || "";
        
        document.getElementById('modalTitulo').innerText = "Editar Incidencia";
        this.modal.show();
    },

    async handleGuardar() {
        const id = document.getElementById('edit-id').value;
        const reporteExistente = id ? this.datos.find(x => x.id === id) : null;

        // ESTRUCTURA FINAL: IDÉNTICA A LO QUE ESPERA ANDROID
        const payload = {
            adminId: auth.currentUser.uid,
            titulo: document.getElementById('rep-momento').value, // Sincronizado con móvil
            descripcion: document.getElementById('rep-desc').value, // Sincronizado con móvil
            laboratorio: document.getElementById('rep-lab').value,
            usuarioNombre: document.getElementById('rep-user').value,
            estado: id ? reporteExistente.estado : 'Abierto',
            timestamp: id ? (reporteExistente.timestamp || Date.now()) : Date.now(),
            fechaDeRegistro: id ? (reporteExistente.fechaDeRegistro || new Date().toLocaleDateString('es-ES')) : new Date().toLocaleDateString('es-ES')
        };

        try {
            await ReportesModel.guardar(payload, id);
            this.modal.hide();
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Hubo un error al guardar la incidencia.");
        }
    },

    async handleEliminar(id) {
        if (confirm("¿Estás seguro de que deseas eliminar esta incidencia? Esta acción no se puede deshacer.")) {
            try {
                await ReportesModel.eliminar(id);
            } catch (error) {
                console.error("Error al eliminar:", error);
            }
        }
    },

    render() {
        // Filtrado y ordenación (Los más recientes primero)
        const filtrados = this.datos
            .filter(r => {
                if (this.filtroActual === 'todos') return true;
                const estado = (r.estado || "").toLowerCase();
                return estado === this.filtroActual.toLowerCase();
            })
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Enviamos a la vista
        ReportesView.renderTabla(filtrados);
    }
};

// Exponemos para el cambio de estado rápido desde la tabla
window.cambiarEstado = async (id, nuevoEstado) => {
    try {
        await ReportesModel.guardar({ estado: nuevoEstado }, id);
    } catch (error) {
        console.error("Error al cambiar estado:", error);
    }
};