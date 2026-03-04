import { ProtocolController } from '../controllers/protocoloController.js';

const tabla = document.getElementById('lista-protocolos');

export const renderProtocolos = async () => {
    const protocolos = await ProtocolController.obtenerProtocolos();
    tabla.innerHTML = '';

    protocolos.forEach(p => {
        tabla.innerHTML += `
            <tr>
                <td><strong>${p.titulo}</strong></td>
                <td><span class="badge bg-info text-dark">${p.categoria}</span></td>
                <td>${p.fechaCreacion}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-warning" onclick="editar('${p.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarProtocoloUI('${p.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
};

// Función global para eliminar desde el botón de la tabla
window.eliminarProtocoloUI = async (id) => {
    if(confirm("¿Seguro que quieres eliminar este protocolo técnico?")) {
        await ProtocolController.eliminarProtocolo(id);
        renderProtocolos();
    }
};