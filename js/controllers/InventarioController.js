import { InventarioModel } from '../models/InventarioModel.js';
import { InventarioView } from '../views/InventarioView.js';
import { auth } from '../config/firebase-config.js';

export const InventarioController = {
    datos: [],
    tipoFiltro: 'reactivo',
    paginaActual: 1,
    filasPorPagina: 10,

    init() {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Suscripción a los datos del inventario
            InventarioModel.suscribirseAInventario(user.uid, (data) => {
                this.datos = data;
                this.refrescarUI(document.getElementById('busqueda')?.value.toLowerCase() || "");
            });

            // PRECARGA DE LABORATORIOS: 
            // Esto llena el select apenas inicia la app para que esté listo al abrir el modal
            this.cargarLaboratoriosSelect(); 
            
        } else {
            window.location.href = 'login.html';
        }
    });

    this.configurarEventos();
    window.descargarPlantillaInventario = () => this.descargarPlantilla();
    window.exportarInventarioCompleto = () => this.exportarCSV();
},
    async cargarSedes(userId) {
        // Consulta a la colección 'laboratorios' filtrando por el admin logueado
        const q = query(collection(db, "laboratorios"), where("adminId", "==", userId));
        
        onSnapshot(q, (snap) => {
            const select = document.getElementById('art-laboratorio');
            if (!select) return;

            // Limpiar y poner opción por defecto
            select.innerHTML = '<option value="" disabled selected>Seleccionar laboratorio...</option>';
            
            snap.forEach(doc => {
                const sede = doc.data().nombre;
                const option = document.createElement('option');
                option.value = sede;
                option.textContent = sede;
                select.appendChild(option);
            });
            
            console.log(`Sedes cargadas: ${snap.size}`);
        }, (error) => {
            console.error("Error cargando laboratorios:", error);
        });
    },
    refrescarUI(terminoBusqueda = "") {
        // 1. Filtrado inicial
        const filtrados = this.datos.filter(i => {
            const coincideTipo = i.tipo === this.tipoFiltro;
            const nombre = (i.nombre || "").toLowerCase();
            const lote = (i.lote || "").toLowerCase();
            return coincideTipo && (nombre.includes(terminoBusqueda) || lote.includes(terminoBusqueda));
        });

        // 2. Lógica de Paginación
        const total = filtrados.length;
        let datosPaginados = filtrados;

        if (this.filasPorPagina !== "all") {
            const inicio = (this.paginaActual - 1) * this.filasPorPagina;
            const fin = inicio + parseInt(this.filasPorPagina);
            datosPaginados = filtrados.slice(inicio, fin);
        }

        // 3. Renderizar Tabla y Contador
        InventarioView.renderizarTabla(datosPaginados, this.tipoFiltro);
        document.getElementById('pag-total').innerText = total;

        // 4. Renderizar Botones de Paginación
        this.renderizarControlesPaginacion(total);
    },

    renderizarControlesPaginacion(totalElementos) {
        const contenedor = document.getElementById('controles-paginacion');
        if (!contenedor) return;
        contenedor.innerHTML = "";

        if (this.filasPorPagina === "all" || totalElementos <= this.filasPorPagina) return;

        const totalPaginas = Math.ceil(totalElementos / this.filasPorPagina);

        for (let i = 1; i <= totalPaginas; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${this.paginaActual === i ? 'active' : ''}`;
            li.innerHTML = `<button class="page-link border-0 shadow-sm rounded-2 mx-1">${i}</button>`;
            li.onclick = () => {
                this.paginaActual = i;
                this.refrescarUI(document.getElementById('busqueda').value.toLowerCase());
            };
            contenedor.appendChild(li);
        }
    },

  async cargarLaboratoriosSelect() {
    const selectLab = document.getElementById('art-laboratorio');
    if (!selectLab) return;

    const usuarioActual = auth.currentUser;
    if (!usuarioActual) return;

    try {
        const snap = await InventarioModel.obtenerLaboratorios(usuarioActual.uid);
        
        // Reiniciamos el contenido con la opción por defecto
        selectLab.innerHTML = '<option value="" disabled selected>Seleccione un laboratorio</option>';

        if (snap.empty) {
            const opt = document.createElement('option');
            opt.value = "";
            opt.textContent = "No tienes laboratorios creados";
            opt.disabled = true;
            selectLab.appendChild(opt);
        } else {
            snap.forEach(doc => {
                const lab = doc.data();
                const option = document.createElement('option');
                option.value = lab.nombre; // Asegúrate que en Firebase el campo sea "nombre"
                option.textContent = lab.nombre;
                selectLab.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Error al cargar laboratorios:", error);
        selectLab.innerHTML = '<option value="">Error al cargar laboratorios</option>';
    }
},

    configurarEventos() {
        // 1. Buscador dinámico
        const inputBusqueda = document.getElementById('busqueda');
        if (inputBusqueda) {
            inputBusqueda.addEventListener('input', (e) => {
                this.refrescarUI(e.target.value.toLowerCase());
            });
        }

        // 2. Gestión de Tabs (Reactivos / Fungibles)
        const tabReactivos = document.getElementById('tab-reactivos');
        const tabFungibles = document.getElementById('tab-fungibles');

        if (tabReactivos && tabFungibles) {
            tabReactivos.onclick = () => {
                this.tipoFiltro = 'reactivo';
                this.actualizarEstadoTabs(tabReactivos, tabFungibles);
                this.refrescarUI();
                InventarioView.toggleCampos('reactivo');
            };

            tabFungibles.onclick = () => {
                this.tipoFiltro = 'fungible';
                this.actualizarEstadoTabs(tabFungibles, tabReactivos);
                this.refrescarUI();
                InventarioView.toggleCampos('fungible');
            };
        }

        // 3. Botón "Nuevo Registro"
        const btnNuevo = document.getElementById('btn-nuevo-articulo');
        if (btnNuevo) {
            btnNuevo.onclick = async () => {
                document.getElementById('form-articulo').reset();
                document.getElementById('art-id').value = "";

                // Cargamos laboratorios antes de mostrar el modal
                await this.cargarLaboratoriosSelect();

                InventarioView.toggleCampos(this.tipoFiltro);
                const modal = new bootstrap.Modal(document.getElementById('modalArticulo'));
                modal.show();
            };
        }

        // 4. Formulario Guardar / Actualizar
        const formArticulo = document.getElementById('form-articulo');
        if (formArticulo) {
            formArticulo.onsubmit = async (e) => {
                e.preventDefault();
                const id = document.getElementById('art-id').value;

                const data = {
                    adminId: auth.currentUser.uid,
                    nombre: document.getElementById('art-nombre').value,
                    tipo: document.getElementById('art-tipo').value,
                    marca_fabricante: document.getElementById('art-marca').value,
                    cantidad_unidades: Number(document.getElementById('art-stock').value),
                    capacidad_total: document.getElementById('art-stockTotal').value,
                    riqueza: document.getElementById('art-riqueza').value,
                    molaridad: document.getElementById('art-molaridad').value,
                    capacidad_especifica: document.getElementById('art-capacidad').value,
                    lote: document.getElementById('art-lote').value,
                    fecha_recepcion: document.getElementById('art-recepcion').value,
                    caducidad: document.getElementById('art-caducidad').value,
                    laboratorio: document.getElementById('art-laboratorio').value
                };

                try {
                    await InventarioModel.guardar(data, id);
                    const modalEl = document.getElementById('modalArticulo');
                    const modalInst = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                    modalInst.hide();
                } catch (error) {
                    alert("Error al guardar: " + error.message);
                }
            };

        }

        // 5. Delegación de eventos para Editar y Eliminar
        document.addEventListener('click', async (e) => {
            // Botón Eliminar
            const btnDelete = e.target.closest('.delete-btn');
            if (btnDelete) {
                const id = btnDelete.dataset.id;
                if (confirm("¿Estás seguro de que deseas eliminar este registro?")) {
                    await InventarioModel.eliminar(id);
                }
            }

            // Botón Editar
            const btnEdit = e.target.closest('.edit-btn');
            if (btnEdit) {
                const id = btnEdit.dataset.id;
                const item = await InventarioModel.obtenerPorId(id);
                if (item) this.cargarDatosEnModal(item);
            }
        });

        // 6. Cambio de tipo dentro del propio modal
        const selectTipoModal = document.getElementById('art-tipo');
        if (selectTipoModal) {
            selectTipoModal.onchange = (e) => {
                InventarioView.toggleCampos(e.target.value);
            };
        }
        // 7. Evento para el nuevo selector de filas
        const selector = document.getElementById('selector-filas');
        if (selector) {
            selector.onchange = (e) => {
                this.filasPorPagina = e.target.value === "all" ? "all" : parseInt(e.target.value);
                this.paginaActual = 1; // Resetear a la primera página
                this.refrescarUI(document.getElementById('busqueda').value.toLowerCase());
            };
        }
        const inputImportar = document.getElementById('input-importar');
        if (inputImportar) {
            inputImportar.onchange = (e) => this.procesarCSV(e.target.files[0]);
        }

        // Abrir modal nuevo
        document.getElementById('btn-nuevo-articulo').onclick = () => {
            document.getElementById('form-articulo').reset();
            document.getElementById('art-id').value = "";
            document.getElementById('modal-titulo').innerHTML = '<i class="fas fa-plus me-2"></i>Nuevo Registro';
            const modal = new bootstrap.Modal(document.getElementById('modalArticulo'));
            modal.show();
        };
    },

    async cargarDatosEnModal(item) {
        // Primero cargamos los laboratorios para asegurar que el select tenga opciones
        await this.cargarLaboratoriosSelect();

        document.getElementById('art-id').value = item.id || "";
        document.getElementById('art-nombre').value = item.nombre || "";
        document.getElementById('art-tipo').value = item.tipo || "reactivo";
        document.getElementById('art-marca').value = item.marca_fabricante || "";
        document.getElementById('art-stock').value = item.cantidad_unidades || 0;
        document.getElementById('art-stockTotal').value = item.capacidad_total || "";
        document.getElementById('art-riqueza').value = item.riqueza || "";
        document.getElementById('art-molaridad').value = item.molaridad || "";
        document.getElementById('art-capacidad').value = item.capacidad_especifica || "";
        document.getElementById('art-lote').value = item.lote || "";
        document.getElementById('art-recepcion').value = item.fecha_recepcion || "";
        document.getElementById('art-caducidad').value = item.caducidad || "";
        document.getElementById('art-laboratorio').value = item.laboratorio || "";

        InventarioView.toggleCampos(item.tipo);
        const modal = new bootstrap.Modal(document.getElementById('modalArticulo'));
        modal.show();
    },

    actualizarEstadoTabs(tabActiva, tabInactiva) {
        tabActiva.classList.add('active');
        tabInactiva.classList.remove('active');
        tabActiva.setAttribute('aria-selected', 'true');
        tabInactiva.setAttribute('aria-selected', 'false');
    },
    // Dentro de InventarioController
    descargarPlantilla() {
        // Encabezados exactos según tu captura de Inventario
        const encabezados = "nombre,tipo,marca_fabricante,lote,caducidad,fecha_recepcion,laboratorio,cantidad_unidades,capacidad_especifica,capacidad_total,molaridad,riqueza\n";
        const ejemplo = "Cubreobjetos 24x60mm,fungible,LBG,000241,2027-03-31,2026-03-23,Laboratorio de Prueba,500,5000,4000,,";

        const blob = new Blob([encabezados + ejemplo], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "plantilla_INVENTARIO.csv";
        a.click();
    },

    async procesarCSV(archivo) {
        if (!archivo) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const contenido = e.target.result;
            // Separar por líneas y limpiar espacios/líneas vacías
            const lineas = contenido.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            if (lineas.length < 2) return alert("El archivo está vacío o no tiene datos.");

            const encabezados = lineas[0].split(',').map(h => h.trim());

            // PROTECCIÓN ANTI-CRUCE: Detectar si es un archivo de EQUIPOS
            // Si tiene 'serial' o 'observaciones', bloqueamos la subida en Inventario
            if (encabezados.includes('serial') || encabezados.includes('observaciones')) {
                alert("❌ ERROR: Este archivo pertenece a EQUIPOS técnicos.\n\nPor favor, usa el importador de la sección de Equipos para estos datos.");
                document.getElementById('input-importar').value = "";
                return;
            }

            let creados = 0;
            let errores = 0;

            // Recorrer filas (empezando en 1 para saltar la cabecera)
            for (let i = 1; i < lineas.length; i++) {
                const valores = lineas[i].split(',');

                // Si la fila no tiene la misma cantidad de columnas que la cabecera, saltar
                if (valores.length < encabezados.length) continue;

                const insumo = {};
                encabezados.forEach((header, index) => {
                    insumo[header] = valores[index]?.trim() || "";
                });

                // --- MAPEO Y LIMPIEZA DE DATOS SEGÚN TU FIRESTORE ---

                // 1. Identificador de dueño (minúscula en Inventario según tu imagen)
                insumo.adminId = auth.currentUser.uid;

                // 2. Forzar tipos numéricos (Importante para gráficas y alertas)
                insumo.cantidad_unidades = Number(insumo.cantidad_unidades) || 0;

                // 3. Valores por defecto si vienen vacíos
                if (!insumo.nombre) { errores++; continue; }
                if (!insumo.tipo) insumo.tipo = "fungible";

                try {
                    // Guardar en Firebase usando tu Modelo
                    // Pasamos null como segundo parámetro porque es un registro nuevo (sin ID previo)
                    await InventarioModel.guardar(insumo, null);
                    creados++;
                } catch (err) {
                    console.error(`Error en fila ${i}:`, err);
                    errores++;
                }
            }

            alert(`✅ Proceso finalizado:\n- ${creados} registros cargados con éxito.\n- ${errores} errores o filas omitidas.`);

            // Limpiar el input para permitir volver a cargar el mismo archivo si se desea
            document.getElementById('input-importar').value = "";
        };

        reader.readAsText(archivo, 'UTF-8');
    },

    exportarCSV() {
        if (this.datos.length === 0) {
            return alert("No hay datos disponibles en la tabla para exportar.");
        }

        // 1. Definir encabezados exactos (Coinciden con tu plantilla de importación)
        const headers = [
            "nombre", "tipo", "marca_fabricante", "lote", "caducidad",
            "fecha_recepcion", "laboratorio", "cantidad_unidades",
            "capacidad_especifica", "capacidad_total", "molaridad", "riqueza"
        ];

        // 2. Convertir los datos de la tabla a formato CSV
        const csvRows = [];
        csvRows.push(headers.join(",")); // Agregar cabecera

        for (const item of this.datos) {
            const fila = headers.map(header => {
                // Limpiar comas internas para no romper el CSV
                const valor = item[header] !== undefined ? item[header] : "";
                return `"${String(valor).replace(/"/g, '""')}"`;
            });
            csvRows.push(fila.join(","));
        }

        const csvContent = csvRows.join("\n");

        // 3. Crear el archivo y disparar descarga
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');

        const fecha = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `inventario_labtrack_${fecha}.csv`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

};