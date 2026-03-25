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
        // 1. SEDES (Laboratorios)
        onSnapshot(query(collection(db, "laboratorios"), where("adminId", "==", adminId)), (snap) => {
            const labs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            DashboardView.renderSedes(labs);
            DashboardView.actualizarContador('count-labs', labs.length);
        });

        // 2. INCIDENCIAS (Mantenimientos)
        onSnapshot(query(collection(db, "incidencias"), where("adminId", "==", adminId)), (snap) => {
            const inc = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Mostramos solo las que no están resueltas en la lista, pero contamos todas o las abiertas
            const pendientes = inc.filter(i => i.estado !== 'Resuelto');
            DashboardView.renderMantenimientos(pendientes);
            DashboardView.actualizarContador('count-incidencias', pendientes.length);
        });

        // 3. MATERIALES Y ALERTAS DE STOCK
        onSnapshot(query(collection(db, "inventario"), where("adminId", "==", adminId)), (snap) => {
            const mat = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Actualizar contador total de materiales (El cuadro verde)
            DashboardView.actualizarContador('count-materiales', mat.length);
            
            // Lógica de Alertas: Según tu captura, usamos 'cantidad_unidades' y 'capacidad_total'
            const alertas = mat.filter(m => {
                const actual = Number(m.cantidad_unidades) || 0;
                // Si capacidad_total es String "4000", Number() lo convierte a 4000 correctamente
                const total = Number(m.capacidad_total) || 1; 
                
                // Alerta si queda menos del 30%
                return (actual / total) < 0.3;
            });

            DashboardView.renderAlertas(alertas);
        });

        // 4. PERSONAL (Usuarios)
        // Asegúrate de que tu colección de usuarios tenga el campo 'adminId'
        onSnapshot(query(collection(db, "usuarios"), where("adminId", "==", adminId)), (snap) => {
            const users = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            DashboardView.actualizarContador('count-users', users.length);
        });
    }
};