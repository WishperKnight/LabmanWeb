import { db, auth } from '../config/firebase-config.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { DashboardView } from '../views/DashboardView.js';

export const DashboardController = {
    init() {
        auth.onAuthStateChanged(user => {
            if (user) {
                this.suscribirADatos(user.uid);
            } else {
                window.location.href = 'login.html';
            }
        });
    },

    suscribirADatos(adminId) {
        // 1. Laboratorios (Cambiado de 'sedes' a 'laboratorios')
        onSnapshot(query(collection(db, "laboratorios"), where("adminId", "==", adminId)), (snap) => {
            const labs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            DashboardView.renderSedes(labs);
            DashboardView.actualizarContador('count-labs', labs.length);
        });

        // 2. Incidencias (Mantenimientos)
        onSnapshot(query(collection(db, "incidencias"), where("adminId", "==", adminId)), (snap) => {
            const inc = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            DashboardView.renderMantenimientos(inc.filter(i => i.estado === 'abierto'));
            DashboardView.actualizarContador('count-incidencias', inc.length);
        });

        // 3. Materiales y Alertas de Stock
        onSnapshot(query(collection(db, "inventario"), where("adminId", "==", adminId)), (snap) => {
            const mat = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Filtramos materiales con stock menor al 30%
            const alertas = mat.filter(m => {
                const actual = Number(m.cantidad_unidades) || 0;
                const max = Number(m.cantidad_maxima) || 1; // Evitamos división por 0
                return (actual / max) < 0.4;
            });

            console.log("Alertas detectadas:", alertas.length); // Revisa esto en la consola F12
            DashboardView.renderAlertas(alertas);
        });
    }
};