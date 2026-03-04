export class Protocolo {
    constructor(id, titulo, descripcion, categoria, pasos = [], fechaCreacion = new Date()) {
        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.categoria = categoria; // Ej: "Microbiología", "Química Analítica"
        this.pasos = pasos; // Array de strings
        this.fechaCreacion = fechaCreacion;
    }
}