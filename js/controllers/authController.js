import { auth } from "../models/firebase.js"; // Tu instancia ya configurada
import { 
    signInWithEmailAndPassword, 
    setPersistence, 
    browserSessionPersistence, 
    signOut,
    sendPasswordResetEmail // Importa todo de la misma versión
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * Intenta iniciar sesión
 */
export const intentarLogin = async (email, password) => {
    try {
        // Establecer persistencia (Session = se borra al cerrar pestaña)
        await setPersistence(auth, browserSessionPersistence);
        // Retornar la promesa del login
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        throw error; // Lanzamos para que el catch del HTML lo capture
    }
};

/**
 * Cerrar sesión
 */
export const logout = () => signOut(auth);

/**
 * Enviar correo de recuperación
 * @param {string} email
 */
export const enviarCorreoRecuperacion = async (email) => {
    // IMPORTANTE: Usamos 'auth' (la instancia importada de tu firebase.js)
    return await sendPasswordResetEmail(auth, email);
};

/**
 * Diccionario de errores para el técnico/usuario
 */
export const manejarErrorAuth = (codigo) => {
    switch (codigo) {
        case 'auth/invalid-credential':
            return 'Correo o contraseña incorrectos.';
        case 'auth/user-not-found':
            return 'Este correo no está registrado en el sistema.';
        case 'auth/wrong-password':
            return 'La contraseña es incorrecta.';
        case 'auth/invalid-email':
            return 'El formato del correo no es válido.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos. Tu cuenta ha sido bloqueada temporalmente.';
        default:
            console.error("Error no mapeado:", codigo);
            return 'Error en el servidor. Inténtalo de nuevo.';
    }
};