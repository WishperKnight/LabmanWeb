import { db, auth } from "../js/models/firebase.js";
import { collection, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const procesarCSV = async (file, coleccionDestino) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const lineas = e.target.result.split('\n').filter(l => l.trim() !== "");
            const columnas = lineas[0].split(',').length;

            // VALIDACIÓN ESTRUCTURAL
            if (coleccionDestino === "inventario" && columnas !== 9) return reject("Formato Inventario inválido (9 col)");
            if (coleccionDestino === "equipo" && columnas !== 8) return reject("Formato Equipo inválido (8 col)");

            const batch = writeBatch(db);
            // ... lógica de bucle para cargar datos ...
            await batch.commit();
            resolve(lineas.length - 1);
        };
        reader.readAsText(file);
    });
};