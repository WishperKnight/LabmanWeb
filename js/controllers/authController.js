import { auth } from "../models/firebase.js";
import { 
    signInWithEmailAndPassword, 
    setPersistence, 
    browserSessionPersistence, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export const intentarLogin = async (email, password) => {
    // La persistencia de sesión hace que si cierran la pestaña, se desloguee (más seguro para labs)
    await setPersistence(auth, browserSessionPersistence);
    return signInWithEmailAndPassword(auth, email, password);
};

export const logout = () => signOut(auth);

export const manejarErrorAuth = (code) => {
    switch (code) {
        case 'auth/invalid-credential': return "Correo o contraseña incorrectos.";
        case 'auth/too-many-requests': return "Demasiados intentos. Intente más tarde.";
        case 'auth/user-disabled': return "Esta cuenta ha sido deshabilitada.";
        default: return "Error de conexión con el servidor.";
    }
};