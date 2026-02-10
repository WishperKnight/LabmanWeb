import { db } from '../config/firebase-config.js';
import { 
    collection, query, where, onSnapshot, doc, 
    updateDoc, addDoc, deleteDoc, getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const InventarioModel = {
    // Cambiamos el nombre para que coincida con tu controlador
    suscribirseAInventario(userId, callback) {
        const q = query(collection(db, "inventario"), where("adminId", "==", userId));
        return onSnapshot(q, (snapshot) => {
            const datos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(datos);
        });
    },

    async guardar(data, id = null) {
        if (id) {
            return await updateDoc(doc(db, "inventario", id), data);
        } else {
            return await addDoc(collection(db, "inventario"), data);
        }
    },

    async eliminar(id) {
        return await deleteDoc(doc(db, "inventario", id));
    },

    async obtenerPorId(id) {
        const docRef = doc(db, "inventario", id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    }
};