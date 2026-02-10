// exportador-csv.js
export function descargarCSV(data, nombreArchivo) {
    if (data.length === 0) return alert("No hay datos para exportar");

    const cabeceras = Object.keys(data[0]).join(",");
    const filas = data.map(obj => 
        Object.values(obj).map(val => `"${val}"`).join(",")
    ).join("\n");

    const contenido = "\ufeff" + cabeceras + "\n" + filas;
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${nombreArchivo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}