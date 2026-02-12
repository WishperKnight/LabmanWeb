import { db } from "./firebase.js";
import { 
    collection, addDoc, getDoc, getDocs, query, where, doc, updateDoc, increment, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const EjecucionModel = {
    // Obtener un documento específico por ID (Faltaba este)
    async getDocById(col, id) {
        const docRef = doc(db, col, id);
        return await getDoc(docRef);
    },

    async guardarRegistro(datos) {
        return await addDoc(collection(db, "ejecuciones"), { ...datos, timestamp: serverTimestamp() });
    },

    async cambiarEstadoEjecucion(id, nuevoEstado) {
        const ref = doc(db, "ejecuciones", id);
        return await updateDoc(ref, { estado: nuevoEstado, updatedAt: serverTimestamp() });
    },

    async actualizarStockYHistorial(materialId, cantidad, tecnicoNombre, protocoloNombre) {
        const materialRef = doc(db, "inventario", materialId);
        
        // Creamos el objeto de historial
        const nuevoMovimiento = {
            fecha: new Date().toLocaleString(),
            tecnico: tecnicoNombre,
            protocolo: protocoloNombre,
            cantidad: -cantidad // Negativo porque es consumo
        };

        // Importante: El campo 'stock' debe existir en Firestore como tipo Number
        return await updateDoc(materialRef, {
            stock: increment(-cantidad)
            // Si quieres guardar el historial en un array usa: 
            // historial: arrayUnion(nuevoMovimiento) 
            // (Requiere importar arrayUnion de firestore)
        });
    },

    async getColeccionPorAdmin(col, adminId) {
        const q = query(collection(db, col), where("adminId", "==", adminId));
        return await getDocs(q);
    },
    // Añade esto a tu objeto EjecucionModel
        async getEjecucionesFiltradas(adminId, estado) {
        let q;
        const colRef = collection(db, "ejecuciones");
        
        if (estado === "Todos") {
            q = query(colRef, where("adminId", "==", adminId));
        } else {
            q = query(colRef, where("adminId", "==", adminId), where("estado", "==", estado));
        }
        
        return await getDocs(q);
    }
};