import { db } from "./firebase.js";
import {
    collection, deleteDoc, addDoc, getDoc, getDocs, query, where, doc, updateDoc, increment, serverTimestamp
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
    async guardarAsignacion(datos) {
        return await addDoc(collection(db, "asignaciones"), { ...datos, timestamp: serverTimestamp() });
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
    async borrarAsignacion(id) {
        const ref = doc(db, "asignaciones", id);
        return await deleteDoc(ref); // Recuerda importar 'deleteDoc' arriba
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
    },
    // CANCELAR: Solo cambia el estado
    async cambiarEstadoEjecucion(id, nuevoEstado) {
        const ref = doc(db, "ejecuciones", id);
        return await updateDoc(ref, { estado: nuevoEstado });
    },

    // BORRAR ASIGNACIÓN: Busca en la "bandeja" del técnico y elimina
   async borrarAsignacion(ejecucionId) {
        try {
            // Buscamos el documento en asignaciones cuyo campo 'ejecucionId' coincida
            const q = query(collection(db, "asignaciones"), where("ejecucionId", "==", ejecucionId));
            const snap = await getDocs(q);
            
            const promesas = snap.docs.map(d => deleteDoc(doc(db, "asignaciones", d.id)));
            await Promise.all(promesas);
            console.log("Asignación eliminada con éxito");
        } catch (error) {
            console.error("Error en borrarAsignacion:", error);
        }
    },

    // ELIMINAR REGISTRO: Borra el historial y la asignación
   async eliminarRegistro(id) {
        try {
            // 1. Borrar de la tabla maestra (ejecuciones)
            const refMaestra = doc(db, "ejecuciones", id);
            await deleteDoc(refMaestra);

            // 2. Borrar de la tabla del técnico (asignaciones)
            // IMPORTANTE: Llamamos a EjecucionModel directamente para evitar líos con 'this'
            await EjecucionModel.borrarAsignacion(id);

            return true;
        } catch (error) {
            console.error("Error en eliminarRegistro:", error);
            throw error;
        }
    }
}