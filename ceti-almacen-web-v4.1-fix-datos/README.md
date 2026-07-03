# Sistema CETI - Almacén Virtual 📦

Aplicación web standalone para gestión integral de inventarios y recursos CETI usando HTML5, CSS3 y JavaScript puro.

## ✨ Características

- **✅ CRUD Completo**: Crear, Leer, Actualizar y Eliminar registros
- **✅ 5 Módulos**: Usuarios, Almacenes, Categorías, Items, Reportes
- **✅ Persistencia**: LocalStorage para guardar datos en el navegador
- **✅ Responsive**: Funciona en desktop, tablet y móvil
- **✅ Autenticación**: Login con credenciales de demo
- **✅ Dashboard**: Métricas e información en tiempo real
- **✅ Sin Dependencias**: Solo HTML, CSS y JavaScript vanilla

## 🚀 Inicio Rápido

**Esta carpeta `web/` es 100% autosuficiente.** Ya NO depende de la carpeta
"Ceti almacen" (PHP/XAMPP) ni de rutas externas: todo el CSS, JS e imágenes
que usa están dentro de esta misma carpeta.

### Opción 1: Servidor local (recomendado)
```bash
# Parado DENTRO de la carpeta web/
python -m http.server 8000
```
Luego abre: `http://127.0.0.1:8000/index.html`

### Opción 2: Doble clic
Directamente en el navegador abre `index.html`
⚠️ Algunos navegadores restringen `localStorage` bajo `file://`; si el login
o el guardado de datos no funciona, usa la Opción 1.

### 🆕 Funciones portadas desde el proyecto PHP/XAMPP (v2.1)
Se añadió toda la lógica de negocio que existía en el backend PHP original,
adaptada a JavaScript + `localStorage` (sin necesidad de servidor):

- **Generación automática de código QR** al crear un item, con el mismo
  formato que PHP: `CETI-XXX-AAAAMMDDHHMMSS`.
- **Código QR real (imagen escaneable)**: botón "Ver QR" en cada item abre
  `item-qr.html`, que genera el QR con la librería QRious (canvas), permite
  **descargarlo como PNG**, **imprimir la etiqueta** y **copiar los datos**.
  ⚠️ Requiere conexión a internet la primera vez (se carga desde CDN, igual
  que en el proyecto PHP original); si no hay internet, se muestra el código
  de texto como respaldo.
- **Trigger de mantenimiento automático**: al registrar un item nuevo se
  crea automáticamente un reporte de mantenimiento preventivo, igual que el
  trigger `after_insert_item` de la base de datos original.
- **Generación automática de código de reporte**: formato `RPT-AAAAMMDD-NNN`.
- **Resolución de nombres relacionados**: los listados y el dashboard ahora
  muestran el nombre real de la categoría, el almacén y el item asociado
  (antes se mostraban IDs sueltos).
- **Búsqueda y filtros funcionales** en Items (nombre/código/categoría/estado)
  y Reportes (título/código/estado/tipo/prioridad), además de búsqueda simple
  en Usuarios, Almacenes y Categorías.
- **Mi Perfil** (`modulos/perfil.html`): el usuario en sesión puede editar su
  nombre, correo y contraseña.
- **Activar / desactivar usuarios**: clic sobre el badge de estado en el
  listado de Usuarios (equivalente a `usuarios/activar.php`).
- **Generar Reporte imprimible** (`generar_reportes.html`, enlazado desde el
  botón "📊 Generar Reporte" del dashboard): filtra por almacén/categoría/
  estado y genera una vista lista para imprimir o guardar como PDF desde el
  navegador (Ctrl+P → Guardar como PDF), equivalente a `generar_reportes.php`
  con TCPDF.
- **Roles reales**: además de `admin`, ahora hay usuarios `almacen` y
  `docente` de ejemplo; si el usuario en sesión no es admin, el enlace
  "Usuarios" se oculta del menú.

## 🔐 Credenciales por Defecto

| Usuario | Contraseña | Rol | Estado |
|---------|-----------|-----|--------|
| `admin` | `admin123` | admin (acceso total) | Activo |
| `juan.almacen` | `almacen123` | almacen | Activo |
| `docente1` | `docente123` | docente | Activo |
| `ana.torres` | `almacen123` | almacen | Activo |
| `carlos.ruiz` | `almacen123` | almacen | Activo |
| `luis.gomez` | `almacen123` | almacen | **Inactivo** (para probar el bloqueo de login) |

## 📦 Datos de ejemplo precargados

El sistema arranca con datos realistas para poder probar cada función sin
tener que capturar todo manualmente:

- **11 almacenes** físicos (Almacén Principal, Laboratorio de Cómputo, Taller
  de Electromecánica, Audiovisuales, Electrónica, Manufactura, Mobiliario,
  Biblioteca, Química, Deportivo, Limpieza y Mantenimiento).
- **12 categorías** (Cómputo, Audiovisual, Mobiliario, Laboratorio, Talleres,
  Deportes, Médico, Limpieza, Oficina, Biblioteca, Electrónica, Herramientas).
- **156 items**, distribuidos entre todos los almacenes y categorías, con
  estados variados (disponible, en uso, mantenimiento, prestado, baja).
- **31 de esos items** tienen la cantidad actual igual o por debajo de su
  stock mínimo a propósito, para que las alertas de stock (fila roja +
  badge "⚠ Stock bajo" + tarjeta "Alertas de Stock" del dashboard) sean
  visibles desde el primer vistazo.
- **24 reportes** de mantenimiento con tipos, prioridades y estados mixtos.

Si quieres empezar desde cero, borra los datos del navegador para ese sitio
(o usa "Restaurar respaldo" en Mi Perfil con un archivo vacío) y el sistema
volverá a sembrar estos mismos datos de ejemplo.

## 📁 Estructura del Proyecto

```
web/
├── 📄 index.html                 Login page
├── 📄 dashboard.html             Main panel
│
├── 📂 modulos/                   CRUD modules
│   ├── usuarios.html             List users
│   ├── usuarios-crear.html       Create user
│   ├── usuarios-editar.html      Edit user
│   ├── almacenes.html
│   ├── almacenes-crear.html
│   ├── almacenes-editar.html
│   ├── categorias.html
│   ├── categorias-crear.html
│   ├── categorias-editar.html
│   ├── items.html
│   ├── items-crear.html
│   ├── items-editar.html
│   ├── reportes.html
│   ├── reportes-crear.html
│   └── reportes-editar.html
│
├── 📂 js/
│   ├── app.js                    Core logic (CRUD)
│   └── scripts.js                Utilities
│
├── 📂 css/
│   ├── bootstrap.min.css         Bootstrap 5
│   ├── styles.css                Global styles
│   └── dashboard.css             Layout & responsive
│
└── 📂 assets/
    ├── 📂 images/
    └── 📂 qr_codes/
```

## 🎯 Módulos Disponibles

### 1. **Usuarios** 👥
Gestión de usuarios del sistema
- Campos: Usuario, Nombre, Email, Rol, Contraseña, Estado
- Roles: admin, almacén, docente

### 2. **Almacenes** 🏢
Ubicaciones de almacenamiento
- Campos: Código, Nombre, Ubicación, Capacidad, Responsable, Teléfono, Estado

### 3. **Categorías** 🏷️
Clasificación de items
- Campos: Código, Nombre, Color, Descripción, Estado

### 4. **Items** 📦
Inventario de equipos y recursos
- Campos: Código QR, Nombre, Categoría, Almacén, Modelo, Marca, Serie, Estado, Valor, Vida Útil

### 5. **Reportes** 📋
Seguimiento de mantenimiento
- Campos: Código, Título, Item, Tipo, Prioridad, Estado, Descripción

## 🔄 Flujo CRUD

### CREATE (Crear)
```
Módulo → [Nuevo Recurso] → Formulario → Guardar → Lista actualizada
```

### READ (Leer)
```
Módulo → Tabla con todos los registros → Ver detalles
```

### UPDATE (Actualizar)
```
Módulo → [Editar] → Formulario precargado → Guardar → Lista actualizada
```

### DELETE (Eliminar)
```
Módulo → [Eliminar] → Confirmación → Registro eliminado
```

## 💾 Almacenamiento de Datos

### LocalStorage
Los datos se guardan en el navegador automáticamente:

| Clave | Contenido |
|-------|-----------|
| `ceti_auth` | Usuario autenticado |
| `ceti_users` | Lista de usuarios |
| `ceti_almacenes` | Lista de almacenes |
| `ceti_categorias` | Lista de categorías |
| `ceti_items` | Inventario |
| `ceti_reportes` | Reportes |

**Datos de ejemplo iniciales**:
- 1 Usuario (admin)
- 1 Almacén
- 1 Categoría  
- 1 Item
- 1 Reporte

Ver datos en DevTools: `F12 → Application → LocalStorage`

## 📱 Responsive Design

| Dispositivo | Ancho | Columnas |
|-------------|-------|----------|
| Desktop | 992px+ | 4 |
| Tablet | 641-991px | 2 |
| Móvil | ≤640px | 1 |

## 🛠️ Tecnologías

- **HTML5**: Semántica y estructura
- **CSS3**: Flexbox, Grid, Media Queries
- **JavaScript ES6+**: Sin librerías
- **Bootstrap 5**: Framework CSS
- **LocalStorage API**: Persistencia

## ⚙️ Cómo Funciona

### 1. Autenticación
```javascript
// Credenciales se validan contra localStorage
users = getModuleData('usuarios');
match = users.find(u => u.usuario === input && u.contrasena === pwd);
if (match) localStorage.setItem('ceti_auth', user);
```

### 2. CRUD con localStorage
```javascript
// Guardar datos
function saveModuleData(moduleName, data) {
  localStorage.setItem(STORAGE_KEYS[moduleName], JSON.stringify(data));
}

// Cargar datos
function getModuleData(moduleName) {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS[moduleName]));
}
```

### 3. Renderizado Dinámico
```javascript
// Generar HTML desde datos
function renderList(moduleName) {
  const rows = getModuleData(moduleName);
  const html = rows.map(row => `<tr>...</tr>`).join('');
  tbody.innerHTML = html;
}
```

## 🐛 Troubleshooting

### Problema: "Datos no se guardan"
**Solución**: 
1. Abre DevTools (F12)
2. Ve a Application → LocalStorage
3. Verifica que tenga datos
4. Si está vacío, reinicia el navegador

### Problema: "CSS no carga"
**Solución**:
1. Recarga con Ctrl+Shift+R (sin caché)
2. Verifica rutas de CSS en HTML
3. Abre DevTools y busca errores 404

### Problema: "Formulario no se envía"
**Solución**:
1. Completa TODOS los campos
2. Comprueba que form tenga id="module-form"
3. Verifica que app.js se cargue (F12 → Console)

### Problema: "Página se ve oscura"
**Solución**:
1. Es un problema de render de Playwright, no de CSS
2. Los estilos están correctos (verifica con DevTools)
3. Abre en un navegador real (Chrome, Firefox, Edge)

## 🚀 Próximas Mejoras

- [ ] Conexión a base de datos MySQL/PHP
- [ ] Exportar datos a PDF/Excel
- [ ] Busqueda y filtrado en tiempo real
- [ ] Generador de código QR
- [ ] Sincronización en la nube
- [ ] Notificaciones push
- [ ] Modo oscuro/claro

## 📝 Licencia

Proyecto educativo - Centro CETI

## 📧 Soporte

Si encuentras problemas:
1. Abre DevTools (F12)
2. Revisa la consola para errores
3. Verifica el estado de localStorage
4. Comprueba que el servidor esté activo en puerto 8000

---

**Versión**: 1.0  
**Estado**: ✅ COMPLETAMENTE FUNCIONAL  
**Última actualización**: 02/07/2026  
**Base de datos**: LocalStorage (demo)
