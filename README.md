# LabmanWeb
📁 Proyecto Lab Track 🔬

Sistema integral de gestión de laboratorio: Inventario, Protocolos y Administración de Personal.

🌟 Características Principales

Panel de Administración: Gestión de usuarios, asignación de roles (Supervisor, Técnico, Usuario) y control de acceso.

Control de Ejecuciones: Filtrado en tiempo real de operaciones por estado (Pendiente, En Curso, Completado).

Inventario Inteligente: Descuento automático de stock al completar protocolos.

Arquitectura MVC: Separación clara entre Modelos (Firebase), Vistas (HTML/Bootstrap) y Controladores (JS).

🛠️ Instalación y Configuración Local

Este proyecto utiliza un sistema de recursos locales para garantizar la velocidad y privacidad. Sigue estos pasos para preparar tu entorno:

1. Clonar el repositorio

git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
2. Preparar recursos multimedia (Assets)
Hemos incluido un script de automatización que descarga las dependencias necesarias (Bootstrap y FontAwesome) y crea la estructura de carpetas.

Requisito: Tener instalado Node.js.


node setup-assets.js
3. Configuración de Firebase
Edita el archivo js/models/firebase.js y coloca tus credenciales:


const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO_ID",
  // ... resto de la config
};

📂 Estructura del Proyecto



├── .github/workflows/  # Integración Continua (GitHub Actions)
├── assets/             # Iconos, imágenes y multimedia local
├── css/                # Estilos locales (Bootstrap, FontAwesome, Custom)
├── js/
│   ├── controllers/    # Lógica de la interfaz
│   ├── models/         # Comunicación con Firebase
│   └── sidebar.js      # Componente de navegación global
├── webfonts/           # Fuentes físicas de FontAwesome
├── index.html          # Punto de entrada principal
└── setup-assets.js     # Script de preparación inicial

🚀 Despliegue (CI/CD)

El proyecto cuenta con un flujo de Integración Continua mediante GitHub Actions.

Cada Push a main dispara una validación de integridad.

Si los recursos están correctos, se despliega automáticamente en GitHub Pages.

🔐 Seguridad

Firestore Rules: Asegúrate de configurar las reglas en Firebase para que solo los adminId puedan ver sus propios usuarios y laboratorios.

Passwords: Las contraseñas se gestionan directamente en la colección usuarios (Firestore) para un control total del administrador.

📄 Licencia

Este proyecto es de uso privado para laboratorios de análisis clínicos. Todos los derechos reservados.
