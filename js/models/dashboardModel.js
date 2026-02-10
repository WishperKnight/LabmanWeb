import { db } from './firebase.js';
import { 
    collection, onSnapshot, query, where, doc, writeBatch, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Escucha cambios en cualquier colección filtrada por el administrador
export const observarColeccion = (coleccion, adminId, callback) => {
    const q = query(collection(db, coleccion), where("adminId", "==", adminId));
    return onSnapshot(q, callback);
};

// Escucha incidencias abiertas
export const observarIncidencias = (adminId, callback) => {
    const q = query(
        collection(db, "incidencias"), 
        where("adminId", "==", adminId), 
        where("estado", "==", "abierto")
    );
    return onSnapshot(q, callback);
};

// Acción para cerrar incidencia
export const finalizarIncidencia = async (id) => {
    const batch = writeBatch(db);
    const ref = doc(db, "incidencias", id);
    batch.update(ref, { 
        estado: "cerrado", 
        fecha_cierre: serverTimestamp() 
    });
    return await batch.commit();
};