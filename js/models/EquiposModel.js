import { db } from '../config/firebase-config.js';
import { 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    where, 
    doc, 
    updateDoc, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * EquiposModel: Se encarga exclusivamente de la persistencia de datos.
 */
export const EquiposModel = {
    
    /**
     * Escucha cambios en la colección de equipos para un administrador específico.
     * @param {string} adminId - El UID del usuario autenticado.
     * @param {function} callback - Función que recibe los datos actualizados.
     */
    suscribirseAEquipos(adminId, callback) {
        const q = query(
            collection(db, "equipos"), 
            where("adminId", "==", adminId)
        );

        return onSnapshot(q, (snap) => {
            const equipos = snap.docs.map(d => ({
                id: d.id,
                ...d.data()
            }));
            callback(equipos);
        }, (error) => {
            console.error("Error en suscripción de equipos:", error);
        });
    },

    /**
     * Crea un nuevo equipo o actualiza uno existente.
     * @param {object} data - Los datos del equipo.
     * @param {string|null} id - El ID del documento (si es edición).
     */
    async guardar(data, id = null) {
        try {
            if (id) {
                const docRef = doc(db, "equipos", id);
                return await updateDoc(docRef, data);
            } else {
                return await addDoc(collection(db, "equipos"), data);
            }
        } catch (error) {
            console.error("Error al persistir equipo:", error);
            throw error;
        }
    },

    /**
     * Elimina un equipo de la base de datos.
     * @param {string} id - ID del documento a eliminar.
     */
    async eliminar(id) {
        try {
            const docRef = doc(db, "equipos", id);
            return await deleteDoc(docRef);
        } catch (error) {
            console.error("Error al eliminar equipo:", error);
            throw error;
        }
    }
};