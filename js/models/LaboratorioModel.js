import { db } from '../config/firebase-config.js';
import { 
    collection, query, where, onSnapshot, getDocs, 
    addDoc, updateDoc, deleteDoc, doc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const LaboratorioModel = {
    // 1. CORREGIDO: "laboratorios" en plural para coincidir con el resto
    suscribirLaboratorios(adminId, callback) {
        console.log("Suscribiendo a laboratorios para adminId:", adminId);
        const q = query(collection(db, "laboratorios"), where("adminId", "==", adminId));
        
        return onSnapshot(q, (snapshot) => {
            console.log("Snapshot recibido. Documentos encontrados:", snapshot.size);
            callback(snapshot);
        }, (error) => {
            console.error("Error en onSnapshot de Laboratorios:", error);
        });
    },

    async getSupervisores(adminId) {
        // Asegúrate que en Firestore sea "Supervisor" con S mayúscula
        const q = query(collection(db, "usuarios"), 
                        where("rol", "==", "Supervisor"), 
                        where("adminId", "==", adminId));
        return await getDocs(q);
    },
    async getEquiposPorLab(nombreLab, adminId) {
    // IMPORTANTE: El campo en 'equipos' debe ser 'laboratorios'
    const q = query(
        collection(db, "equipos"), 
        where("laboratorio", "==", nombreLab), 
        where("adminId", "==", adminId)
    );
    return await getDocs(q);
    },
   async getCountEquipos(nombreLab, adminId) {
    const q = query(
        collection(db, "equipos"), 
        where("laboratorio", "==", nombreLab),
        where("adminId", "==", adminId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size; // .size devuelve el total de documentos encontrados
},
    async guardar(id, datos) {
        if (id) {
            const ref = doc(db, "laboratorios", id);
            return await updateDoc(ref, datos);
        } else {
            return await addDoc(collection(db, "laboratorios"), datos);
        }
    },

    async eliminar(id) {
        return await deleteDoc(doc(db, "laboratorios", id));
    }
};