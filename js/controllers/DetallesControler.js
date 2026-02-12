// js/controllers/DetalleController.js
import { db } from '../config/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const DetalleController = {
    async init() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        
        if (id) {
            const docSnap = await getDoc(doc(db, "ejecuciones", id));
            if (docSnap.exists()) {
                this.renderizarDetalle(docSnap.data());
            }
        }
    },

    renderizarDetalle(data) {
        document.getElementById('nombre-protocolo').innerText = data.protocolo;
        document.getElementById('det-tecnico').innerText = data.tecnico;
        document.getElementById('det-equipo').innerText = data.equipo || 'N/A';
        document.getElementById('det-desc').innerText = data.descripcion;
        
        const listaMat = document.getElementById('lista-materiales');
        listaMat.innerHTML = '';

        // Si el protocolo tiene materiales asociados (array de objetos)
        if (data.materiales && data.materiales.length > 0) {
            data.materiales.forEach(mat => {
                listaMat.innerHTML += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${mat.nombre}
                        <span class="badge bg-primary rounded-pill">${mat.cantidad}</span>
                    </li>`;
            });
        } else {
            listaMat.innerHTML = '<li class="list-group-item text-muted">No se registraron materiales.</li>';
        }
    }
};