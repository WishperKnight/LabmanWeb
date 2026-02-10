import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { 
    apiKey: "AIzaSyA_aXLKh1HXcXGD1_s7mA7VuCPsSm1IBPA", 
    authDomain: "labmanager-b85b1.firebaseapp.com", 
    projectId: "labmanager-b85b1", 
    appId: "1:651630503448:web:9a327cbf30b84fd763c56d" 
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios para que el Modelo y el Controlador los usen
export const auth = getAuth(app);
export const db = getFirestore(app);