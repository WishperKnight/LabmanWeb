import { db } from "./firebase.js";
import { 
    collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const AdminModel = {
    // Escuchar cambios en tiempo real de usuarios propios
    listenUsuarios(adminId, callback) {
        const q = query(collection(db, "usuarios"), where("adminId", "==", adminId));
        return onSnapshot(q, (snap) => {
            const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(users);
        });
    },

    // Escuchar laboratorios disponibles
    listenLabs(adminId, callback) {
        const q = query(collection(db, "laboratorios"), where("adminId", "==", adminId));
        return onSnapshot(q, (snap) => {
            const labs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(labs);
        });
    },

    async crearUsuario(datos) {
        return await addDoc(collection(db, "usuarios"), {
            ...datos,
            fechaCreacion: serverTimestamp()
        });
    },

    async actualizarUsuario(id, data) {
        const ref = doc(db, "usuarios", id);
        return await updateDoc(ref, data);
    },

    async eliminarUsuario(id) {
        return await deleteDoc(doc(db, "usuarios", id));
    },
    // Dentro de AdminModel.js
async actualizarPasswordFirestore(userId, nuevaPassword) {
    const userRef = doc(db, "usuarios", userId);
    return await updateDoc(userRef, {
        password: nuevaPassword,
        ultimaModificacionClave: new Date().toISOString()
    });
}
};