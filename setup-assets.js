const fs = require('fs');
const https = require('https');
const path = require('path');

// 1. Definir estructura de carpetas
const dirs = [
    'css',
    'js/controllers',
    'js/models',
    'assets/icons',
    'assets/img'
];

// 2. Recursos a descargar
const resources = [
    {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
        dest: 'css/bootstrap.min.css'
    },
    {
        url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
        dest: 'js/bootstrap.bundle.min.js'
    },
    {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
        dest: 'css/all.min.css'
    }
];

// Función para crear carpetas
dirs.forEach(dir => {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Carpeta creada: ${dir}`);
});

// Función para descargar archivos
const download = (url, dest) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`⬇️ Descargado: ${dest}`);
        });
    }).on('error', (err) => {
        fs.unlink(dest);
        console.error(`❌ Error descargando ${url}: ${err.message}`);
    });
};

// Ejecutar descargas
resources.forEach(res => download(res.url, res.dest));

// Crear el archivo favicon.svg localmente
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#3b82f6" d="M352 320c-23.03 0-44.42 8.35-61.1 22.06l-67.9-20.94c4.6-11.41 7-23.59 7-36.12 0-53.02-42.98-96-96-96s-96 42.98-96 96 42.98 96 96 96c8.48 0 16.63-1.11 24.39-3.18l67.35 20.77C226.04 443.34 224 447.45 224 452c0 33.14 26.86 60 60 60h168c33.14 0 60-26.86 60-60v-72c0-33.14-26.86-60-60-60H352zM134 320c-18.78 0-34-15.22-34-34s15.22-34 34-34 34 15.22 34 34-15.22 34-34 34z"/></svg>`;
fs.writeFileSync('assets/icons/favicon.svg', svgContent);
console.log('🎨 Favicon generado en assets/icons/favicon.svg');