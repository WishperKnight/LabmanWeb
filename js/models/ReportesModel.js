import { db } from '../config/firebase-config.js';
import { 
    collection, addDoc, onSnapshot, query, where, doc, updateDoc, deleteDoc, getDocs 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const ReportesModel = {
    suscribirse(adminId, callback) {
        const q = query(collection(db, "incidencias"), where("adminId", "==", adminId));
        return onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(data);
        });
    },

    async guardar(data, id = null) {
        return id ? updateDoc(doc(db, "incidencias", id), data) : addDoc(collection(db, "incidencias"), data);
    },

    async eliminar(id) {
        return deleteDoc(doc(db, "incidencias", id));
    },

    async obtenerDesplegables(adminId) {
        const qLabs = query(collection(db, "laboratorios"), where("adminId", "==", adminId));
        const qUsers = query(collection(db, "usuarios"), where("adminId", "==", adminId));
        const [labs, users] = await Promise.all([getDocs(qLabs), getDocs(qUsers)]);
        return {
            labs: labs.docs.map(d => d.data().nombre),
            users: users.docs.map(d => d.data().nombre)
        };
    }
};