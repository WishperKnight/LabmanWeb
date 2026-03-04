import { db } from '../config/firebase-config.js';
import { 
    collection, query, where, onSnapshot, doc, 
    updateDoc, addDoc, deleteDoc, getDoc, getDocs, orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const InventarioModel = {
    
    // Suscripción en tiempo real al inventario del usuario
    suscribirseAInventario(userId, callback) {
        const q = query(collection(db, "inventario"), where("adminId", "==", userId));
        return onSnapshot(q, (snapshot) => {
            const datos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            callback(datos);
        });
    },

    // Obtener SOLO los laboratorios que pertenecen al adminId
   // InventarioModel.js
async obtenerLaboratorios(userId) {
    try {
        const q = query(
            collection(db, "laboratorios"), 
            where("adminId", "==", userId)
            // Quita el orderBy("nombre", "asc") por ahora si no quieres crear el índice
        );
        return await getDocs(q);
    } catch (error) {
        throw error;
    }
},

    // Guardar o actualizar registro de inventario
    async guardar(data, id = null) {
        if (id) {
            return await updateDoc(doc(db, "inventario", id), data);
        } else {
            return await addDoc(collection(db, "inventario"), data);
        }
    },

    // Eliminar registro
    async eliminar(id) {
        return await deleteDoc(doc(db, "inventario", id));
    },

    // Obtener un solo artículo por su ID
    async obtenerPorId(id) {
        const docRef = doc(db, "inventario", id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    }
};