import { collection, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Procesa un archivo CSV y lo sube a la colección correspondiente de Firebase
 */
export async function importarCSV(file, db, coleccionDestino) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const contenido = event.target.result;
                const lineas = contenido.split('\n').filter(linea => linea.trim() !== "");
                const batch = writeBatch(db);
                let contador = 0;

                // Empezamos en i=1 para saltar la cabecera
                for (let i = 1; i < lineas.length; i++) {
                    const col = lineas[i].split(',').map(c => c.trim());
                    
                    if (col.length >= 4) {
                        const ref = doc(collection(db, coleccionDestino));
                        let datos = {};

                        if (coleccionDestino === "inventario") {
                            // Estructura para MATERIALES (PDF páginas 2-4)
                            datos = {
                                nombre: col[0],
                                tipo: col[1].toLowerCase(),
                                cantidad: parseInt(col[2]) || 0,
                                capacidadTotal: parseInt(col[3]) || 0,
                                laboratorio: col[4] || "General",
                                lote: col[5] || "N/A",
                                caducidad: col[6] || "N/A",
                                marca: col[7] || "N/A",
                                fechaRegistro: new Date().toISOString()
                            };
                        } else if (coleccionDestino === "equipos") {
                            // Estructura para EQUIPOS (PDF página 1)
                            datos = {
                                nombre: col[0],
                                serial: col[1] || "S/N",
                                fabricante: col[2] || "Desconocido",
                                tipo: col[3] || "Otros",
                                laboratorio: col[4] || "General",
                                observaciones: col[5] || "",
                                codigoInterno: col[6] || "N/A", // Código del PDF
                                estado: "Operativo",
                                fechaAlta: new Date().toISOString()
                            };
                        }

                        batch.set(ref, datos);
                        contador++;
                    }
                }

                if (contador > 0) {
                    await batch.commit();
                    resolve(contador);
                } else {
                    reject("No se encontraron datos válidos en el CSV.");
                }
            } catch (error) {
                reject("Error al procesar el archivo: " + error.message);
            }
        };

        reader.onerror = () => reject("Error al leer el archivo.");
        reader.readAsText(file);
    });
}

/**
 * Genera una alerta visual en el dashboard
 */
export function mostrarFeedback(mensaje, tipo, contenedorId) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show rounded-4 shadow-sm border-0 mb-4" role="alert">
            <i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}