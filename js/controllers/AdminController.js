import { auth } from "../models/firebase.js";
import { AdminModel } from "../models/AdminModel.js";

export const AdminController = {
    adminId: null,
    usuarios: [],
    laboratorios: [],

    async init() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.adminId = user.uid;
                this.iniciarRealtime();
                this.configurarEventos();
            } else {
                window.location.href = 'login.html';
            }
        });
    },

    iniciarRealtime() {
        // Escuchar Usuarios
        AdminModel.listenUsuarios(this.adminId, (lista) => {
            this.usuarios = lista;
            this.aplicarFiltros();
        });

        // Escuchar Laboratorios (para los selects de la tabla)
        AdminModel.listenLabs(this.adminId, (lista) => {
            this.laboratorios = lista;
            this.aplicarFiltros();
        });
    },

    configurarEventos() {
        document.getElementById('busqueda-usuario').oninput = () => this.aplicarFiltros();
        document.getElementById('filtro-rol').onchange = () => this.aplicarFiltros();
        
        document.getElementById('form-nuevo-usuario').onsubmit = async (e) => {
            e.preventDefault();
            const datos = {
                nombre: document.getElementById('nuevo-nombre').value,
                email: document.getElementById('nuevo-email').value,
                rol: document.getElementById('nuevo-rol').value,
                laboratorioId: "",
                adminId: this.adminId
            };
            await AdminModel.crearUsuario(datos);
            bootstrap.Modal.getInstance(document.getElementById('modalNuevoUsuario')).hide();
        };
    },

    aplicarFiltros() {
        const texto = document.getElementById('busqueda-usuario').value.toLowerCase();
        const rol = document.getElementById('filtro-rol').value;

        const filtrados = this.usuarios.filter(u => {
            const coincideTexto = u.nombre?.toLowerCase().includes(texto) || u.email?.toLowerCase().includes(texto);
            const coincideRol = rol === "todos" || u.rol === rol;
            return coincideTexto && coincideRol;
        });

        this.renderTabla(filtrados);
    },

    renderTabla(lista) {
    const cont = document.getElementById('lista-usuarios');
    cont.innerHTML = lista.map(u => {
        const rolColor = u.rol === 'Supervisor' ? 'danger' : (u.rol === 'tecnico' ? 'primary' : 'secondary');
        
        return `
            <tr>
                <td class="ps-4">
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle me-3">${u.nombre?.charAt(0) || '?'}</div>
                        <div>
                            <div class="fw-bold text-dark">${u.nombre || 'Sin nombre'}</div>
                            <div class="text-muted small">${u.email}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-${rolColor}-subtle text-${rolColor} rounded-pill px-3">${u.rol?.toUpperCase()}</span></td>
                <td>
                    <select class="form-select form-select-sm border-0 bg-light" onchange="AdminController.asignarLab('${u.id}', this.value)">
                        <option value="">Sin asignar</option>
                        ${this.laboratorios.map(lab => `<option value="${lab.id}" ${u.laboratorioId === lab.id ? 'selected' : ''}>${lab.nombre}</option>`).join('')}
                    </select>
                </td>
                <td class="text-end pe-4">
                    <button onclick="AdminController.prepararCambioPassword('${u.id}', '${u.nombre}')" 
                            class="btn btn-sm btn-light text-warning rounded-circle me-2 shadow-sm"
                            title="Cambiar Contraseña">
                        <i class="fas fa-key"></i>
                    </button>

                    <button onclick="AdminController.prepararCambioRol('${u.id}', '${u.nombre}', '${u.rol}')" 
                            class="btn btn-sm btn-light text-primary rounded-circle me-2 shadow-sm"
                            title="Editar Permisos">
                        <i class="fas fa-user-shield"></i>
                    </button>

                    <button onclick="AdminController.eliminarUsuario('${u.id}', '${u.nombre}')" 
                            class="btn btn-sm btn-light text-danger rounded-circle shadow-sm"
                            title="Eliminar Usuario">
                        <i class="fas fa-user-minus"></i>
                    </button>
                </td>
            </tr>`;
    }).join('');
},

    // Métodos Globales expuestos
    async asignarLab(userId, labId) {
        await AdminModel.actualizarUsuario(userId, { laboratorioId: labId });
    },

    prepararCambioRol(id, nombre, rolActual) {
        document.getElementById('user-id-rol').value = id;
        document.getElementById('user-nombre-rol').innerText = nombre;
        document.getElementById('select-nuevo-rol').value = rolActual;
        new bootstrap.Modal(document.getElementById('modalRol')).show();
    },

    async guardarNuevoRol() {
        const id = document.getElementById('user-id-rol').value;
        const nuevoRol = document.getElementById('select-nuevo-rol').value;
        await AdminModel.actualizarUsuario(id, { rol: nuevoRol });
        bootstrap.Modal.getInstance(document.getElementById('modalRol')).hide();
    },

    async eliminarUsuario(id, nombre) {
        if (confirm(`¿Eliminar permanentemente a ${nombre}?`)) {
            await AdminModel.eliminarUsuario(id);
        }
    },
    // Dentro de AdminController.js

// 1. Preparar el modal (se activa desde el botón de la llave en la tabla)
prepararCambioPassword(id, nombre) {
    document.getElementById('pass-user-id').value = id;
    document.getElementById('pass-user-nombre').innerText = nombre;
    document.getElementById('nueva-password-input').value = ""; // Limpiar
    new bootstrap.Modal(document.getElementById('modalPassword')).show();
},

// 2. Ejecutar el cambio
async guardarNuevaPassword() {
    const id = document.getElementById('pass-user-id').value;
    const pass = document.getElementById('nueva-password-input').value;

    if (pass.length < 4) {
        alert("La contraseña debe tener al menos 4 caracteres.");
        return;
    }

    try {
        await AdminModel.actualizarPasswordFirestore(id, pass);
        alert("Contraseña actualizada correctamente en la ficha del usuario.");
        bootstrap.Modal.getInstance(document.getElementById('modalPassword')).hide();
    } catch (error) {
        console.error(error);
        alert("Error al actualizar la contraseña.");
    }
}

// 3. No olvides añadir el botón en tu renderizarTabla()
/* 
*/
};

window.AdminController = AdminController;