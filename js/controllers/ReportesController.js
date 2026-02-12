import { ReportesModel } from '../models/ReportesModel.js';
import { ReportesView } from '../views/ReportesView.js'; // Importamos la Vista
import { auth } from '../config/firebase-config.js';
import { cargarSidebar } from '../sidebar.js';

export const ReportesController = {
    datos: [],
    filtroActual: 'todos',
    modal: null,

    async init() {
        this.modal = new bootstrap.Modal(document.getElementById('modalReporte'));
        cargarSidebar('reportes');

        auth.onAuthStateChanged(user => {
            if (user) {
                // Suscripción al Modelo
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
        // Gestión de Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.onclick = (e) => {
                this.filtroActual = e.target.dataset.filter;
                // UI: Cambiar estado activo de los botones
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.replace('btn-primary', 'btn-light'));
                e.target.classList.replace('btn-light', 'btn-primary');
                this.render();
            };
        });

        // Envío del Formulario
        document.getElementById('form-reporte').onsubmit = async (e) => {
            e.preventDefault();
            this.handleGuardar();
        };

        // Delegación de eventos para la tabla
        document.getElementById('lista-reportes').onclick = (e) => {
            const id = e.target.closest('button')?.dataset.id;
            if (e.target.closest('.btn-delete')) this.handleEliminar(id);
            if (e.target.closest('.btn-edit')) this.handleEditar(id);
        };
        
        document.getElementById('btn-nuevo-reporte').onclick = () => this.abrirModal();
    },

    async abrirModal() {
        // Obtenemos datos del modelo y pedimos a la Vista que los pinte
        const { labs, users } = await ReportesModel.obtenerDesplegables(auth.currentUser.uid);
        ReportesView.renderDesplegables(labs, users);
        
        document.getElementById('form-reporte').reset();
        document.getElementById('edit-id').value = "";
        document.getElementById('modalTitulo').innerText = "Nuevo Reporte";
        this.modal.show();
    },

    async handleEditar(id) {
        const r = this.datos.find(item => item.id === id);
        if (!r) return;

        // Cargamos los selects antes de llenar el formulario
        const { labs, users } = await ReportesModel.obtenerDesplegables(auth.currentUser.uid);
        ReportesView.renderDesplegables(labs, users);

        document.getElementById('edit-id').value = r.id;
        document.getElementById('rep-momento').value = r.Momento;
        document.getElementById('rep-lab').value = r.laboratorio;
        document.getElementById('rep-user').value = r.usuarioNombre;
        document.getElementById('rep-desc').value = r.Descripcion;
        document.getElementById('modalTitulo').innerText = "Editar Reporte";
        
        this.modal.show();
    },

    async handleGuardar() {
        const id = document.getElementById('edit-id').value;
        const reporteExistente = id ? this.datos.find(x => x.id === id) : null;

        const payload = {
            adminId: auth.currentUser.uid,
            Momento: document.getElementById('rep-momento').value,
            laboratorio: document.getElementById('rep-lab').value,
            usuarioNombre: document.getElementById('rep-user').value,
            Descripcion: document.getElementById('rep-desc').value,
            estado: id ? reporteExistente.estado : 'abierto',
            timestamp: id ? reporteExistente.timestamp : Date.now(),
            FechaDeRegistro: id ? reporteExistente.FechaDeRegistro : new Date().toLocaleDateString('es-ES')
        };

        await ReportesModel.guardar(payload, id);
        this.modal.hide();
    },

    async handleEliminar(id) {
        if (confirm("¿Seguro que deseas eliminar este reporte?")) {
            await ReportesModel.eliminar(id);
        }
    },

    render() {
        // El controlador filtra los datos (Lógica de negocio)
        const filtrados = this.datos
            .filter(r => this.filtroActual === 'todos' || r.estado === this.filtroActual)
            .sort((a, b) => b.timestamp - a.timestamp);

        // El controlador le pasa los datos limpios a la Vista (Lógica de presentación)
        ReportesView.renderTabla(filtrados);
    }
};

// Exponemos la función de cambio de estado para el 'onchange' del HTML generado por la Vista
window.cambiarEstado = (id, estado) => ReportesModel.guardar({ estado }, id);