/* ============================================================
   CETI Almacén - app.js (v3)
   Implementa TODOS los requerimientos del documento del
   Proyecto Integrador (RF, RNF y RI) sobre una versión web
   autosuficiente (localStorage), sin depender de PHP/XAMPP.
   ============================================================ */

const STORAGE_KEYS = {
  auth: 'ceti_auth',
  users: 'ceti_users',
  usuarios: 'ceti_users',
  almacenes: 'ceti_almacenes',
  categorias: 'ceti_categorias',
  items: 'ceti_items',
  reportes: 'ceti_reportes'
};

/* ---------- RNF03: hash de contraseñas (SHA-256, con fallback) ---------- */
async function hashPassword(plain) {
  try {
    if (window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder().encode(plain);
      const buf = await window.crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) { /* sigue al fallback */ }
  // Fallback no criptográfico (solo si el navegador no soporta Web Crypto,
  // p.ej. al abrir el sitio con file:// en vez de servirlo por http/https)
  let hash = 0;
  for (let i = 0; i < plain.length; i++) {
    hash = ((hash << 5) - hash + plain.charCodeAt(i)) | 0;
  }
  return 'fb' + Math.abs(hash).toString(16);
}

/* ---------- RNF04: escape de HTML (equivalente a prevenir inyección) ---------- */
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const defaultUsersPlain = [
  { id: 1, usuario: 'admin', nombre_completo: 'Admin CETI', email: 'admin@ceti.mx', rol: 'admin', contrasena: 'admin123', estado: 'Activo', ultimo_acceso: '02/07/2026 12:00' },
  { id: 2, usuario: 'juan.almacen', nombre_completo: 'Juan Pérez', email: 'juan.almacen@ceti.mx', rol: 'almacen', contrasena: 'almacen123', estado: 'Activo', ultimo_acceso: 'Nunca' },
  { id: 3, usuario: 'docente1', nombre_completo: 'María Docente', email: 'docente1@ceti.mx', rol: 'docente', contrasena: 'docente123', estado: 'Activo', ultimo_acceso: 'Nunca' },
  { id: 4, usuario: 'ana.torres', nombre_completo: 'Ana Torres', email: 'ana.torres@ceti.mx', rol: 'almacen', contrasena: 'almacen123', estado: 'Activo', ultimo_acceso: 'Nunca' },
  { id: 5, usuario: 'carlos.ruiz', nombre_completo: 'Carlos Ruiz', email: 'carlos.ruiz@ceti.mx', rol: 'almacen', contrasena: 'almacen123', estado: 'Activo', ultimo_acceso: 'Nunca' },
  { id: 6, usuario: 'luis.gomez', nombre_completo: 'Luis Gómez', email: 'luis.gomez@ceti.mx', rol: 'almacen', contrasena: 'almacen123', estado: 'Inactivo', ultimo_acceso: '28/05/2026 09:15' },
];

const defaultData = {
  almacenes: [
    { id: 1, codigo: 'ALM-001', nombre: 'Almacén Principal', ubicacion: 'Edificio A, Planta Baja', capacidad: '500', responsable: 'Juan Pérez', telefono: '333-123-4567', estado: 'Activo' },
    { id: 2, codigo: 'ALM-002', nombre: 'Laboratorio de Cómputo', ubicacion: 'Edificio B, 2do piso', capacidad: '150', responsable: 'María Docente', telefono: '333-123-4568', estado: 'Activo' },
    { id: 3, codigo: 'ALM-003', nombre: 'Taller de Electromecánica', ubicacion: 'Edificio C, Planta Baja', capacidad: '200', responsable: 'Juan Pérez', telefono: '333-123-4569', estado: 'Activo' },
    { id: 4, codigo: 'ALM-004', nombre: 'Almacén de Audiovisuales', ubicacion: 'Edificio A, 1er piso', capacidad: '80', responsable: 'Ana Torres', telefono: '333-123-4570', estado: 'Activo' },
    { id: 5, codigo: 'ALM-005', nombre: 'Laboratorio de Electrónica', ubicacion: 'Edificio B, 1er piso', capacidad: '180', responsable: 'Carlos Ruiz', telefono: '333-123-4571', estado: 'Activo' },
    { id: 6, codigo: 'ALM-006', nombre: 'Taller de Manufactura', ubicacion: 'Edificio D, Planta Baja', capacidad: '220', responsable: 'Juan Pérez', telefono: '333-123-4572', estado: 'Activo' },
    { id: 7, codigo: 'ALM-007', nombre: 'Almacén de Mobiliario', ubicacion: 'Edificio E, Planta Baja', capacidad: '300', responsable: 'Ana Torres', telefono: '333-123-4573', estado: 'Activo' },
    { id: 8, codigo: 'ALM-008', nombre: 'Biblioteca', ubicacion: 'Edificio F, Planta Baja', capacidad: '120', responsable: 'María Docente', telefono: '333-123-4574', estado: 'Activo' },
    { id: 9, codigo: 'ALM-009', nombre: 'Laboratorio de Química', ubicacion: 'Edificio B, 3er piso', capacidad: '90', responsable: 'Carlos Ruiz', telefono: '333-123-4575', estado: 'Activo' },
    { id: 10, codigo: 'ALM-010', nombre: 'Almacén Deportivo', ubicacion: 'Área Deportiva', capacidad: '100', responsable: 'Luis Gómez', telefono: '333-123-4576', estado: 'Activo' },
    { id: 11, codigo: 'ALM-011', nombre: 'Almacén de Limpieza y Mantenimiento', ubicacion: 'Edificio A, Sótano', capacidad: '150', responsable: 'Luis Gómez', telefono: '333-123-4577', estado: 'Activo' },
  ],
  categorias: [
    { id: 1, codigo: 'CAT-001', nombre: 'Cómputo', color: '#2563eb', descripcion: 'Equipos de cómputo y periféricos', estado: 'Activa' },
    { id: 2, codigo: 'CAT-002', nombre: 'Audiovisual', color: '#7c3aed', descripcion: 'Proyectores, pantallas y equipo audiovisual', estado: 'Activa' },
    { id: 3, codigo: 'CAT-003', nombre: 'Mobiliario', color: '#16a34a', descripcion: 'Mesas, sillas y muebles', estado: 'Activa' },
    { id: 4, codigo: 'CAT-004', nombre: 'Laboratorio', color: '#f59e0b', descripcion: 'Material e instrumentos de laboratorio', estado: 'Activa' },
    { id: 5, codigo: 'CAT-005', nombre: 'Talleres', color: '#dc2626', descripcion: 'Herramientas y maquinaria de talleres', estado: 'Activa' },
    { id: 6, codigo: 'CAT-006', nombre: 'Deportes', color: '#0891b2', descripcion: 'Material y equipo deportivo', estado: 'Activa' },
    { id: 7, codigo: 'CAT-007', nombre: 'Médico', color: '#db2777', descripcion: 'Botiquín y equipo de primeros auxilios', estado: 'Activa' },
    { id: 8, codigo: 'CAT-008', nombre: 'Limpieza', color: '#65a30d', descripcion: 'Insumos y equipo de limpieza', estado: 'Activa' },
    { id: 9, codigo: 'CAT-009', nombre: 'Oficina', color: '#4338ca', descripcion: 'Material y equipo de oficina', estado: 'Activa' },
    { id: 10, codigo: 'CAT-010', nombre: 'Biblioteca', color: '#0d9488', descripcion: 'Libros y material bibliográfico', estado: 'Activa' },
    { id: 11, codigo: 'CAT-011', nombre: 'Electrónica', color: '#ea580c', descripcion: 'Componentes y equipo electrónico', estado: 'Activa' },
    { id: 12, codigo: 'CAT-012', nombre: 'Herramientas', color: '#57534e', descripcion: 'Herramienta manual y eléctrica', estado: 'Activa' },
  ],
  items: [
    { id: 1, codigo_qr: 'CETI-DIS-001', nombre_item: 'Disco duro externo 1TB', id_categoria: 1, id_almacen: 2, modelo: 'Mod-658', marca: 'Seagate', numero_serie: 'SN-0001', estado: 'disponible', fecha_adquisicion: '2023-11-24', valor_aproximado: '600', vida_util: '12', cantidad_actual: '9', stock_minimo: '5', descripcion: 'Disco duro externo 1TB para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 2, codigo_qr: 'CETI-CAB-002', nombre_item: 'Cable HDMI 10m', id_categoria: 2, id_almacen: 1, modelo: 'Mod-833', marca: 'Steren', numero_serie: 'SN-0002', estado: 'disponible', fecha_adquisicion: '2023-09-07', valor_aproximado: '6500', vida_util: '60', cantidad_actual: '10', stock_minimo: '1', descripcion: 'Cable HDMI 10m para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 3, codigo_qr: 'CETI-ARC-003', nombre_item: 'Archivero metálico', id_categoria: 3, id_almacen: 4, modelo: 'Mod-448', marca: 'Steelcase', numero_serie: 'SN-0003', estado: 'en_uso', fecha_adquisicion: '2024-12-14', valor_aproximado: '12500', vida_util: '36', cantidad_actual: '4', stock_minimo: '3', descripcion: 'Archivero metálico para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 4, codigo_qr: 'CETI-MUL-004', nombre_item: 'Multímetro digital', id_categoria: 4, id_almacen: 4, modelo: 'Mod-370', marca: 'Fluke', numero_serie: 'SN-0004', estado: 'baja', fecha_adquisicion: '2025-06-20', valor_aproximado: '450', vida_util: '12', cantidad_actual: '1', stock_minimo: '2', descripcion: 'Multímetro digital para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 5, codigo_qr: 'CETI-ESM-005', nombre_item: 'Esmeriladora', id_categoria: 5, id_almacen: 8, modelo: 'Mod-982', marca: 'Makita', numero_serie: 'SN-0005', estado: 'en_uso', fecha_adquisicion: '2025-11-20', valor_aproximado: '450', vida_util: '36', cantidad_actual: '8', stock_minimo: '1', descripcion: 'Esmeriladora para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 6, codigo_qr: 'CETI-CRO-006', nombre_item: 'Cronómetro deportivo', id_categoria: 6, id_almacen: 4, modelo: 'Mod-338', marca: 'Casio', numero_serie: 'SN-0006', estado: 'prestado', fecha_adquisicion: '2025-02-28', valor_aproximado: '12500', vida_util: '12', cantidad_actual: '1', stock_minimo: '1', descripcion: 'Cronómetro deportivo para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 7, codigo_qr: 'CETI-TEN-007', nombre_item: 'Tensiómetro digital', id_categoria: 7, id_almacen: 5, modelo: 'Mod-373', marca: 'Omron', numero_serie: 'SN-0007', estado: 'en_uso', fecha_adquisicion: '2025-04-22', valor_aproximado: '1500', vida_util: '12', cantidad_actual: '8', stock_minimo: '5', descripcion: 'Tensiómetro digital para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 8, codigo_qr: 'CETI-BOT-008', nombre_item: 'Bote de basura', id_categoria: 8, id_almacen: 11, modelo: 'Mod-804', marca: 'Rubbermaid', numero_serie: 'SN-0008', estado: 'disponible', fecha_adquisicion: '2026-05-21', valor_aproximado: '3500', vida_util: '60', cantidad_actual: '6', stock_minimo: '3', descripcion: 'Bote de basura para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 9, codigo_qr: 'CETI-GUI-009', nombre_item: 'Guillotina de papel', id_categoria: 9, id_almacen: 11, modelo: 'Mod-167', marca: 'Swingline', numero_serie: 'SN-0009', estado: 'disponible', fecha_adquisicion: '2025-07-09', valor_aproximado: '12500', vida_util: '24', cantidad_actual: '2', stock_minimo: '1', descripcion: 'Guillotina de papel para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 10, codigo_qr: 'CETI-DIC-010', nombre_item: 'Diccionario técnico', id_categoria: 10, id_almacen: 4, modelo: 'Mod-352', marca: 'Larousse', numero_serie: 'SN-0010', estado: 'mantenimiento', fecha_adquisicion: '2024-05-05', valor_aproximado: '3500', vida_util: '60', cantidad_actual: '13', stock_minimo: '2', descripcion: 'Diccionario técnico para uso en clases del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 11, codigo_qr: 'CETI-SEN-011', nombre_item: 'Sensor de temperatura', id_categoria: 11, id_almacen: 10, modelo: 'Mod-148', marca: 'Steren', numero_serie: 'SN-0011', estado: 'en_uso', fecha_adquisicion: '2026-02-25', valor_aproximado: '600', vida_util: '12', cantidad_actual: '7', stock_minimo: '3', descripcion: 'Sensor de temperatura para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 12, codigo_qr: 'CETI-LLA-012', nombre_item: 'Llave inglesa', id_categoria: 12, id_almacen: 11, modelo: 'Mod-641', marca: 'Truper', numero_serie: 'SN-0012', estado: 'disponible', fecha_adquisicion: '2026-10-15', valor_aproximado: '2200', vida_util: '36', cantidad_actual: '7', stock_minimo: '5', descripcion: 'Llave inglesa para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 13, codigo_qr: 'CETI-SWI-013', nombre_item: 'Switch de red 24 puertos', id_categoria: 1, id_almacen: 1, modelo: 'Mod-545', marca: 'TP-Link', numero_serie: 'SN-0013', estado: 'mantenimiento', fecha_adquisicion: '2025-02-10', valor_aproximado: '12500', vida_util: '24', cantidad_actual: '4', stock_minimo: '5', descripcion: 'Switch de red 24 puertos para uso en laboratorio del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 14, codigo_qr: 'CETI-TRÍ-014', nombre_item: 'Trípode para cámara', id_categoria: 2, id_almacen: 1, modelo: 'Mod-991', marca: 'Manfrotto', numero_serie: 'SN-0014', estado: 'prestado', fecha_adquisicion: '2024-09-04', valor_aproximado: '12500', vida_util: '36', cantidad_actual: '14', stock_minimo: '5', descripcion: 'Trípode para cámara para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 15, codigo_qr: 'CETI-LIB-015', nombre_item: 'Librero metálico', id_categoria: 3, id_almacen: 3, modelo: 'Mod-600', marca: 'Steelcase', numero_serie: 'SN-0015', estado: 'disponible', fecha_adquisicion: '2023-10-11', valor_aproximado: '22000', vida_util: '12', cantidad_actual: '10', stock_minimo: '1', descripcion: 'Librero metálico para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 16, codigo_qr: 'CETI-BAL-016', nombre_item: 'Balanza analítica', id_categoria: 4, id_almacen: 6, modelo: 'Mod-597', marca: 'Ohaus', numero_serie: 'SN-0016', estado: 'baja', fecha_adquisicion: '2023-02-24', valor_aproximado: '22000', vida_util: '12', cantidad_actual: '6', stock_minimo: '2', descripcion: 'Balanza analítica para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 17, codigo_qr: 'CETI-PRE-017', nombre_item: 'Prensa hidráulica', id_categoria: 5, id_almacen: 9, modelo: 'Mod-993', marca: 'Truper', numero_serie: 'SN-0017', estado: 'baja', fecha_adquisicion: '2024-05-17', valor_aproximado: '4800', vida_util: '60', cantidad_actual: '0', stock_minimo: '1', descripcion: 'Prensa hidráulica para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 18, codigo_qr: 'CETI-COL-018', nombre_item: 'Colchoneta de ejercicio', id_categoria: 6, id_almacen: 4, modelo: 'Mod-482', marca: 'Everlast', numero_serie: 'SN-0018', estado: 'en_uso', fecha_adquisicion: '2026-11-21', valor_aproximado: '1200', vida_util: '48', cantidad_actual: '17', stock_minimo: '5', descripcion: 'Colchoneta de ejercicio para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 19, codigo_qr: 'CETI-TER-019', nombre_item: 'Termómetro infrarrojo', id_categoria: 7, id_almacen: 8, modelo: 'Mod-107', marca: 'Braun', numero_serie: 'SN-0019', estado: 'disponible', fecha_adquisicion: '2024-10-08', valor_aproximado: '250', vida_util: '12', cantidad_actual: '7', stock_minimo: '1', descripcion: 'Termómetro infrarrojo para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 20, codigo_qr: 'CETI-ASP-020', nombre_item: 'Aspiradora industrial', id_categoria: 8, id_almacen: 4, modelo: 'Mod-597', marca: 'Karcher', numero_serie: 'SN-0020', estado: 'disponible', fecha_adquisicion: '2024-05-22', valor_aproximado: '4800', vida_util: '24', cantidad_actual: '3', stock_minimo: '1', descripcion: 'Aspiradora industrial para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 21, codigo_qr: 'CETI-DES-021', nombre_item: 'Destructora de papel', id_categoria: 9, id_almacen: 3, modelo: 'Mod-196', marca: 'Fellowes', numero_serie: 'SN-0021', estado: 'prestado', fecha_adquisicion: '2026-07-07', valor_aproximado: '12500', vida_util: '12', cantidad_actual: '7', stock_minimo: '3', descripcion: 'Destructora de papel para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 22, codigo_qr: 'CETI-ATL-022', nombre_item: 'Atlas de ingeniería', id_categoria: 10, id_almacen: 6, modelo: 'Mod-845', marca: 'Editorial CETI', numero_serie: 'SN-0022', estado: 'en_uso', fecha_adquisicion: '2023-01-13', valor_aproximado: '250', vida_util: '36', cantidad_actual: '14', stock_minimo: '2', descripcion: 'Atlas de ingeniería para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 23, codigo_qr: 'CETI-PRO-023', nombre_item: 'Protoboard', id_categoria: 11, id_almacen: 4, modelo: 'Mod-355', marca: 'Steren', numero_serie: 'SN-0023', estado: 'disponible', fecha_adquisicion: '2024-05-15', valor_aproximado: '2200', vida_util: '12', cantidad_actual: '4', stock_minimo: '1', descripcion: 'Protoboard para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 24, codigo_qr: 'CETI-PIN-024', nombre_item: 'Pinza de electricista', id_categoria: 12, id_almacen: 9, modelo: 'Mod-969', marca: 'Klein', numero_serie: 'SN-0024', estado: 'disponible', fecha_adquisicion: '2023-02-25', valor_aproximado: '15800', vida_util: '24', cantidad_actual: '10', stock_minimo: '1', descripcion: 'Pinza de electricista para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 25, codigo_qr: 'CETI-MON-025', nombre_item: 'Monitor LED 24"', id_categoria: 1, id_almacen: 7, modelo: 'Mod-102', marca: 'Samsung', numero_serie: 'SN-0025', estado: 'en_uso', fecha_adquisicion: '2023-03-13', valor_aproximado: '22000', vida_util: '48', cantidad_actual: '9', stock_minimo: '2', descripcion: 'Monitor LED 24" para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 26, codigo_qr: 'CETI-CÁM-026', nombre_item: 'Cámara de video', id_categoria: 2, id_almacen: 8, modelo: 'Mod-403', marca: 'Canon', numero_serie: 'SN-0026', estado: 'disponible', fecha_adquisicion: '2026-03-07', valor_aproximado: '12500', vida_util: '24', cantidad_actual: '14', stock_minimo: '2', descripcion: 'Cámara de video para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 27, codigo_qr: 'CETI-SIL-027', nombre_item: 'Silla de oficina', id_categoria: 3, id_almacen: 10, modelo: 'Mod-614', marca: 'OfficeMax', numero_serie: 'SN-0027', estado: 'prestado', fecha_adquisicion: '2023-10-16', valor_aproximado: '250', vida_util: '60', cantidad_actual: '2', stock_minimo: '3', descripcion: 'Silla de oficina para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 28, codigo_qr: 'CETI-MUL-028', nombre_item: 'Multímetro digital', id_categoria: 4, id_almacen: 1, modelo: 'Mod-340', marca: 'Fluke', numero_serie: 'SN-0028', estado: 'en_uso', fecha_adquisicion: '2023-11-28', valor_aproximado: '6500', vida_util: '48', cantidad_actual: '3', stock_minimo: '1', descripcion: 'Multímetro digital para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 29, codigo_qr: 'CETI-TAL-029', nombre_item: 'Taladro de banco', id_categoria: 5, id_almacen: 10, modelo: 'Mod-678', marca: 'Bosch', numero_serie: 'SN-0029', estado: 'disponible', fecha_adquisicion: '2026-11-19', valor_aproximado: '450', vida_util: '60', cantidad_actual: '13', stock_minimo: '3', descripcion: 'Taladro de banco para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 30, codigo_qr: 'CETI-RED-030', nombre_item: 'Red de voleibol', id_categoria: 6, id_almacen: 5, modelo: 'Mod-760', marca: 'Mikasa', numero_serie: 'SN-0030', estado: 'disponible', fecha_adquisicion: '2026-03-22', valor_aproximado: '1200', vida_util: '36', cantidad_actual: '9', stock_minimo: '5', descripcion: 'Red de voleibol para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 31, codigo_qr: 'CETI-TEN-031', nombre_item: 'Tensiómetro digital', id_categoria: 7, id_almacen: 6, modelo: 'Mod-235', marca: 'Omron', numero_serie: 'SN-0031', estado: 'baja', fecha_adquisicion: '2024-09-09', valor_aproximado: '450', vida_util: '36', cantidad_actual: '1', stock_minimo: '1', descripcion: 'Tensiómetro digital para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 32, codigo_qr: 'CETI-ASP-032', nombre_item: 'Aspiradora industrial', id_categoria: 8, id_almacen: 4, modelo: 'Mod-769', marca: 'Karcher', numero_serie: 'SN-0032', estado: 'disponible', fecha_adquisicion: '2025-10-26', valor_aproximado: '9800', vida_util: '60', cantidad_actual: '11', stock_minimo: '2', descripcion: 'Aspiradora industrial para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 33, codigo_qr: 'CETI-ENG-033', nombre_item: 'Engargoladora', id_categoria: 9, id_almacen: 11, modelo: 'Mod-209', marca: 'GBC', numero_serie: 'SN-0033', estado: 'en_uso', fecha_adquisicion: '2024-05-04', valor_aproximado: '22000', vida_util: '60', cantidad_actual: '4', stock_minimo: '2', descripcion: 'Engargoladora para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 34, codigo_qr: 'CETI-MAN-034', nombre_item: 'Manual de electromecánica', id_categoria: 10, id_almacen: 5, modelo: 'Mod-357', marca: 'Editorial CETI', numero_serie: 'SN-0034', estado: 'disponible', fecha_adquisicion: '2025-09-16', valor_aproximado: '850', vida_util: '12', cantidad_actual: '9', stock_minimo: '3', descripcion: 'Manual de electromecánica para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 35, codigo_qr: 'CETI-PRO-035', nombre_item: 'Protoboard', id_categoria: 11, id_almacen: 11, modelo: 'Mod-265', marca: 'Steren', numero_serie: 'SN-0035', estado: 'en_uso', fecha_adquisicion: '2024-11-09', valor_aproximado: '12500', vida_util: '48', cantidad_actual: '1', stock_minimo: '2', descripcion: 'Protoboard para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 36, codigo_qr: 'CETI-TAL-036', nombre_item: 'Taladro inalámbrico', id_categoria: 12, id_almacen: 7, modelo: 'Mod-665', marca: 'DeWalt', numero_serie: 'SN-0036', estado: 'en_uso', fecha_adquisicion: '2023-06-19', valor_aproximado: '4800', vida_util: '24', cantidad_actual: '1', stock_minimo: '1', descripcion: 'Taladro inalámbrico para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 37, codigo_qr: 'CETI-IMP-037', nombre_item: 'Impresora láser', id_categoria: 1, id_almacen: 3, modelo: 'Mod-355', marca: 'HP', numero_serie: 'SN-0037', estado: 'disponible', fecha_adquisicion: '2025-04-22', valor_aproximado: '22000', vida_util: '12', cantidad_actual: '3', stock_minimo: '2', descripcion: 'Impresora láser para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 38, codigo_qr: 'CETI-CON-038', nombre_item: 'Consola de audio', id_categoria: 2, id_almacen: 9, modelo: 'Mod-125', marca: 'Yamaha', numero_serie: 'SN-0038', estado: 'en_uso', fecha_adquisicion: '2024-03-14', valor_aproximado: '15800', vida_util: '24', cantidad_actual: '7', stock_minimo: '3', descripcion: 'Consola de audio para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 39, codigo_qr: 'CETI-BAN-039', nombre_item: 'Banco de laboratorio', id_categoria: 3, id_almacen: 7, modelo: 'Mod-491', marca: 'Herman Miller', numero_serie: 'SN-0039', estado: 'baja', fecha_adquisicion: '2024-12-04', valor_aproximado: '1200', vida_util: '12', cantidad_actual: '9', stock_minimo: '5', descripcion: 'Banco de laboratorio para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 40, codigo_qr: 'CETI-MEC-040', nombre_item: 'Mechero Bunsen', id_categoria: 4, id_almacen: 4, modelo: 'Mod-508', marca: 'Fisher', numero_serie: 'SN-0040', estado: 'disponible', fecha_adquisicion: '2023-11-07', valor_aproximado: '850', vida_util: '36', cantidad_actual: '6', stock_minimo: '2', descripcion: 'Mechero Bunsen para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 41, codigo_qr: 'CETI-COM-041', nombre_item: 'Compresor de aire', id_categoria: 5, id_almacen: 2, modelo: 'Mod-998', marca: 'Truper', numero_serie: 'SN-0041', estado: 'baja', fecha_adquisicion: '2025-01-04', valor_aproximado: '2200', vida_util: '36', cantidad_actual: '11', stock_minimo: '2', descripcion: 'Compresor de aire para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 42, codigo_qr: 'CETI-BAL-042', nombre_item: 'Balón de básquetbol', id_categoria: 6, id_almacen: 10, modelo: 'Mod-623', marca: 'Spalding', numero_serie: 'SN-0042', estado: 'disponible', fecha_adquisicion: '2025-07-20', valor_aproximado: '1500', vida_util: '12', cantidad_actual: '0', stock_minimo: '1', descripcion: 'Balón de básquetbol para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 43, codigo_qr: 'CETI-TEN-043', nombre_item: 'Tensiómetro digital', id_categoria: 7, id_almacen: 10, modelo: 'Mod-171', marca: 'Omron', numero_serie: 'SN-0043', estado: 'disponible', fecha_adquisicion: '2024-06-14', valor_aproximado: '250', vida_util: '36', cantidad_actual: '1', stock_minimo: '2', descripcion: 'Tensiómetro digital para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 44, codigo_qr: 'CETI-BOT-044', nombre_item: 'Bote de basura', id_categoria: 8, id_almacen: 6, modelo: 'Mod-434', marca: 'Rubbermaid', numero_serie: 'SN-0044', estado: 'mantenimiento', fecha_adquisicion: '2025-11-14', valor_aproximado: '4800', vida_util: '48', cantidad_actual: '6', stock_minimo: '1', descripcion: 'Bote de basura para uso en prácticas del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 45, codigo_qr: 'CETI-CAL-045', nombre_item: 'Calculadora científica', id_categoria: 9, id_almacen: 9, modelo: 'Mod-408', marca: 'Casio', numero_serie: 'SN-0045', estado: 'disponible', fecha_adquisicion: '2024-10-19', valor_aproximado: '8500', vida_util: '48', cantidad_actual: '8', stock_minimo: '1', descripcion: 'Calculadora científica para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 46, codigo_qr: 'CETI-ENC-046', nombre_item: 'Enciclopedia técnica', id_categoria: 10, id_almacen: 5, modelo: 'Mod-552', marca: 'Editorial CETI', numero_serie: 'SN-0046', estado: 'disponible', fecha_adquisicion: '2025-08-15', valor_aproximado: '6500', vida_util: '24', cantidad_actual: '11', stock_minimo: '1', descripcion: 'Enciclopedia técnica para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 47, codigo_qr: 'CETI-PLA-047', nombre_item: 'Placa PCB perforada', id_categoria: 11, id_almacen: 3, modelo: 'Mod-869', marca: 'Steren', numero_serie: 'SN-0047', estado: 'mantenimiento', fecha_adquisicion: '2025-02-27', valor_aproximado: '8500', vida_util: '24', cantidad_actual: '12', stock_minimo: '1', descripcion: 'Placa PCB perforada para uso en proyectos del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 48, codigo_qr: 'CETI-MUL-048', nombre_item: 'Multímetro de gancho', id_categoria: 12, id_almacen: 5, modelo: 'Mod-886', marca: 'Fluke', numero_serie: 'SN-0048', estado: 'disponible', fecha_adquisicion: '2026-10-28', valor_aproximado: '850', vida_util: '12', cantidad_actual: '1', stock_minimo: '1', descripcion: 'Multímetro de gancho para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 49, codigo_qr: 'CETI-ESC-049', nombre_item: 'Escáner de documentos', id_categoria: 1, id_almacen: 7, modelo: 'Mod-251', marca: 'Epson', numero_serie: 'SN-0049', estado: 'mantenimiento', fecha_adquisicion: '2026-07-08', valor_aproximado: '2200', vida_util: '12', cantidad_actual: '15', stock_minimo: '3', descripcion: 'Escáner de documentos para uso en laboratorio del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 50, codigo_qr: 'CETI-PAN-050', nombre_item: 'Pantalla de proyección', id_categoria: 2, id_almacen: 7, modelo: 'Mod-355', marca: 'Da-Lite', numero_serie: 'SN-0050', estado: 'disponible', fecha_adquisicion: '2026-01-18', valor_aproximado: '4800', vida_util: '12', cantidad_actual: '13', stock_minimo: '1', descripcion: 'Pantalla de proyección para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 51, codigo_qr: 'CETI-SIL-051', nombre_item: 'Silla apilable', id_categoria: 3, id_almacen: 3, modelo: 'Mod-934', marca: 'OfficeMax', numero_serie: 'SN-0051', estado: 'baja', fecha_adquisicion: '2025-08-20', valor_aproximado: '6500', vida_util: '60', cantidad_actual: '11', stock_minimo: '2', descripcion: 'Silla apilable para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 52, codigo_qr: 'CETI-KIT-052', nombre_item: 'Kit de vidriería', id_categoria: 4, id_almacen: 9, modelo: 'Mod-752', marca: 'Pyrex', numero_serie: 'SN-0052', estado: 'en_uso', fecha_adquisicion: '2025-04-27', valor_aproximado: '3500', vida_util: '36', cantidad_actual: '9', stock_minimo: '1', descripcion: 'Kit de vidriería para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 53, codigo_qr: 'CETI-PRE-053', nombre_item: 'Prensa hidráulica', id_categoria: 5, id_almacen: 9, modelo: 'Mod-443', marca: 'Truper', numero_serie: 'SN-0053', estado: 'en_uso', fecha_adquisicion: '2025-04-09', valor_aproximado: '450', vida_util: '36', cantidad_actual: '13', stock_minimo: '5', descripcion: 'Prensa hidráulica para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 54, codigo_qr: 'CETI-CRO-054', nombre_item: 'Cronómetro deportivo', id_categoria: 6, id_almacen: 2, modelo: 'Mod-517', marca: 'Casio', numero_serie: 'SN-0054', estado: 'disponible', fecha_adquisicion: '2024-02-14', valor_aproximado: '600', vida_util: '36', cantidad_actual: '13', stock_minimo: '1', descripcion: 'Cronómetro deportivo para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 55, codigo_qr: 'CETI-TER-055', nombre_item: 'Termómetro infrarrojo', id_categoria: 7, id_almacen: 8, modelo: 'Mod-588', marca: 'Braun', numero_serie: 'SN-0055', estado: 'en_uso', fecha_adquisicion: '2023-10-13', valor_aproximado: '2200', vida_util: '12', cantidad_actual: '8', stock_minimo: '1', descripcion: 'Termómetro infrarrojo para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 56, codigo_qr: 'CETI-DIS-056', nombre_item: 'Dispensador de jabón', id_categoria: 8, id_almacen: 5, modelo: 'Mod-379', marca: 'Rubbermaid', numero_serie: 'SN-0056', estado: 'baja', fecha_adquisicion: '2024-08-08', valor_aproximado: '4800', vida_util: '48', cantidad_actual: '9', stock_minimo: '2', descripcion: 'Dispensador de jabón para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 57, codigo_qr: 'CETI-PRO-057', nombre_item: 'Proyector de acetatos', id_categoria: 9, id_almacen: 1, modelo: 'Mod-737', marca: '3M', numero_serie: 'SN-0057', estado: 'en_uso', fecha_adquisicion: '2024-08-05', valor_aproximado: '9800', vida_util: '60', cantidad_actual: '9', stock_minimo: '2', descripcion: 'Proyector de acetatos para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 58, codigo_qr: 'CETI-ENC-058', nombre_item: 'Enciclopedia técnica', id_categoria: 10, id_almacen: 7, modelo: 'Mod-572', marca: 'Editorial CETI', numero_serie: 'SN-0058', estado: 'mantenimiento', fecha_adquisicion: '2026-03-28', valor_aproximado: '8500', vida_util: '24', cantidad_actual: '5', stock_minimo: '3', descripcion: 'Enciclopedia técnica para uso en clases del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 59, codigo_qr: 'CETI-KIT-059', nombre_item: 'Kit de resistencias', id_categoria: 11, id_almacen: 5, modelo: 'Mod-951', marca: 'Steren', numero_serie: 'SN-0059', estado: 'en_uso', fecha_adquisicion: '2026-05-25', valor_aproximado: '1500', vida_util: '48', cantidad_actual: '8', stock_minimo: '2', descripcion: 'Kit de resistencias para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 60, codigo_qr: 'CETI-MAR-060', nombre_item: 'Martillo', id_categoria: 12, id_almacen: 2, modelo: 'Mod-899', marca: 'Truper', numero_serie: 'SN-0060', estado: 'en_uso', fecha_adquisicion: '2024-11-03', valor_aproximado: '1500', vida_util: '12', cantidad_actual: '2', stock_minimo: '1', descripcion: 'Martillo para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 61, codigo_qr: 'CETI-TAB-061', nombre_item: 'Tablet educativa', id_categoria: 1, id_almacen: 1, modelo: 'Mod-785', marca: 'Lenovo', numero_serie: 'SN-0061', estado: 'disponible', fecha_adquisicion: '2024-03-16', valor_aproximado: '600', vida_util: '12', cantidad_actual: '11', stock_minimo: '1', descripcion: 'Tablet educativa para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 62, codigo_qr: 'CETI-MIC-062', nombre_item: 'Micrófono inalámbrico', id_categoria: 2, id_almacen: 8, modelo: 'Mod-210', marca: 'Shure', numero_serie: 'SN-0062', estado: 'prestado', fecha_adquisicion: '2023-03-10', valor_aproximado: '6500', vida_util: '60', cantidad_actual: '5', stock_minimo: '2', descripcion: 'Micrófono inalámbrico para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 63, codigo_qr: 'CETI-SIL-063', nombre_item: 'Silla de oficina', id_categoria: 3, id_almacen: 5, modelo: 'Mod-807', marca: 'OfficeMax', numero_serie: 'SN-0063', estado: 'mantenimiento', fecha_adquisicion: '2024-02-19', valor_aproximado: '2200', vida_util: '24', cantidad_actual: '12', stock_minimo: '5', descripcion: 'Silla de oficina para uso en proyectos del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 64, codigo_qr: 'CETI-BAL-064', nombre_item: 'Balanza analítica', id_categoria: 4, id_almacen: 5, modelo: 'Mod-538', marca: 'Ohaus', numero_serie: 'SN-0064', estado: 'mantenimiento', fecha_adquisicion: '2023-06-18', valor_aproximado: '12500', vida_util: '36', cantidad_actual: '13', stock_minimo: '3', descripcion: 'Balanza analítica para uso en prácticas del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 65, codigo_qr: 'CETI-TAL-065', nombre_item: 'Taladro de banco', id_categoria: 5, id_almacen: 9, modelo: 'Mod-470', marca: 'Bosch', numero_serie: 'SN-0065', estado: 'mantenimiento', fecha_adquisicion: '2026-02-14', valor_aproximado: '15800', vida_util: '48', cantidad_actual: '1', stock_minimo: '2', descripcion: 'Taladro de banco para uso en laboratorio del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 66, codigo_qr: 'CETI-SIL-066', nombre_item: 'Silbato', id_categoria: 6, id_almacen: 3, modelo: 'Mod-945', marca: 'Fox 40', numero_serie: 'SN-0066', estado: 'en_uso', fecha_adquisicion: '2026-08-14', valor_aproximado: '1200', vida_util: '60', cantidad_actual: '12', stock_minimo: '1', descripcion: 'Silbato para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 67, codigo_qr: 'CETI-EXT-067', nombre_item: 'Extintor', id_categoria: 7, id_almacen: 6, modelo: 'Mod-784', marca: 'Amerex', numero_serie: 'SN-0067', estado: 'disponible', fecha_adquisicion: '2026-10-20', valor_aproximado: '850', vida_util: '48', cantidad_actual: '9', stock_minimo: '1', descripcion: 'Extintor para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 68, codigo_qr: 'CETI-DIS-068', nombre_item: 'Dispensador de jabón', id_categoria: 8, id_almacen: 1, modelo: 'Mod-710', marca: 'Rubbermaid', numero_serie: 'SN-0068', estado: 'en_uso', fecha_adquisicion: '2025-06-09', valor_aproximado: '1500', vida_util: '36', cantidad_actual: '6', stock_minimo: '2', descripcion: 'Dispensador de jabón para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 69, codigo_qr: 'CETI-DES-069', nombre_item: 'Destructora de papel', id_categoria: 9, id_almacen: 1, modelo: 'Mod-761', marca: 'Fellowes', numero_serie: 'SN-0069', estado: 'en_uso', fecha_adquisicion: '2024-12-16', valor_aproximado: '3500', vida_util: '48', cantidad_actual: '0', stock_minimo: '1', descripcion: 'Destructora de papel para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 70, codigo_qr: 'CETI-ATL-070', nombre_item: 'Atlas de ingeniería', id_categoria: 10, id_almacen: 1, modelo: 'Mod-477', marca: 'Editorial CETI', numero_serie: 'SN-0070', estado: 'disponible', fecha_adquisicion: '2025-11-19', valor_aproximado: '850', vida_util: '48', cantidad_actual: '14', stock_minimo: '2', descripcion: 'Atlas de ingeniería para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 71, codigo_qr: 'CETI-FUE-071', nombre_item: 'Fuente regulada 5V', id_categoria: 11, id_almacen: 7, modelo: 'Mod-336', marca: 'Steren', numero_serie: 'SN-0071', estado: 'prestado', fecha_adquisicion: '2025-05-09', valor_aproximado: '3500', vida_util: '12', cantidad_actual: '15', stock_minimo: '3', descripcion: 'Fuente regulada 5V para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 72, codigo_qr: 'CETI-MUL-072', nombre_item: 'Multímetro de gancho', id_categoria: 12, id_almacen: 4, modelo: 'Mod-595', marca: 'Fluke', numero_serie: 'SN-0072', estado: 'disponible', fecha_adquisicion: '2024-04-24', valor_aproximado: '600', vida_util: '36', cantidad_actual: '13', stock_minimo: '1', descripcion: 'Multímetro de gancho para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 73, codigo_qr: 'CETI-WEB-073', nombre_item: 'Webcam HD', id_categoria: 1, id_almacen: 10, modelo: 'Mod-469', marca: 'Logitech', numero_serie: 'SN-0073', estado: 'baja', fecha_adquisicion: '2024-05-08', valor_aproximado: '15800', vida_util: '24', cantidad_actual: '5', stock_minimo: '3', descripcion: 'Webcam HD para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 74, codigo_qr: 'CETI-CÁM-074', nombre_item: 'Cámara de video', id_categoria: 2, id_almacen: 1, modelo: 'Mod-753', marca: 'Canon', numero_serie: 'SN-0074', estado: 'prestado', fecha_adquisicion: '2025-12-05', valor_aproximado: '250', vida_util: '48', cantidad_actual: '3', stock_minimo: '3', descripcion: 'Cámara de video para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 75, codigo_qr: 'CETI-MES-075', nombre_item: 'Mesa de trabajo', id_categoria: 3, id_almacen: 1, modelo: 'Mod-982', marca: 'IKEA', numero_serie: 'SN-0075', estado: 'mantenimiento', fecha_adquisicion: '2024-01-09', valor_aproximado: '1500', vida_util: '48', cantidad_actual: '10', stock_minimo: '2', descripcion: 'Mesa de trabajo para uso en proyectos del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 76, codigo_qr: 'CETI-BAL-076', nombre_item: 'Balanza analítica', id_categoria: 4, id_almacen: 2, modelo: 'Mod-187', marca: 'Ohaus', numero_serie: 'SN-0076', estado: 'en_uso', fecha_adquisicion: '2024-10-10', valor_aproximado: '600', vida_util: '24', cantidad_actual: '2', stock_minimo: '2', descripcion: 'Balanza analítica para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 77, codigo_qr: 'CETI-TAL-077', nombre_item: 'Taladro de banco', id_categoria: 5, id_almacen: 9, modelo: 'Mod-404', marca: 'Bosch', numero_serie: 'SN-0077', estado: 'baja', fecha_adquisicion: '2026-08-15', valor_aproximado: '850', vida_util: '60', cantidad_actual: '12', stock_minimo: '2', descripcion: 'Taladro de banco para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 78, codigo_qr: 'CETI-COL-078', nombre_item: 'Colchoneta de ejercicio', id_categoria: 6, id_almacen: 5, modelo: 'Mod-370', marca: 'Everlast', numero_serie: 'SN-0078', estado: 'mantenimiento', fecha_adquisicion: '2024-11-07', valor_aproximado: '12500', vida_util: '12', cantidad_actual: '3', stock_minimo: '3', descripcion: 'Colchoneta de ejercicio para uso en clases del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 79, codigo_qr: 'CETI-CAM-079', nombre_item: 'Camilla plegable', id_categoria: 7, id_almacen: 4, modelo: 'Mod-581', marca: 'Ferno', numero_serie: 'SN-0079', estado: 'disponible', fecha_adquisicion: '2026-12-20', valor_aproximado: '2200', vida_util: '36', cantidad_actual: '3', stock_minimo: '3', descripcion: 'Camilla plegable para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 80, codigo_qr: 'CETI-ASP-080', nombre_item: 'Aspiradora industrial', id_categoria: 8, id_almacen: 4, modelo: 'Mod-910', marca: 'Karcher', numero_serie: 'SN-0080', estado: 'disponible', fecha_adquisicion: '2024-05-26', valor_aproximado: '450', vida_util: '60', cantidad_actual: '13', stock_minimo: '5', descripcion: 'Aspiradora industrial para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 81, codigo_qr: 'CETI-GUI-081', nombre_item: 'Guillotina de papel', id_categoria: 9, id_almacen: 7, modelo: 'Mod-161', marca: 'Swingline', numero_serie: 'SN-0081', estado: 'disponible', fecha_adquisicion: '2025-03-03', valor_aproximado: '22000', vida_util: '24', cantidad_actual: '6', stock_minimo: '3', descripcion: 'Guillotina de papel para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 82, codigo_qr: 'CETI-DIC-082', nombre_item: 'Diccionario técnico', id_categoria: 10, id_almacen: 10, modelo: 'Mod-816', marca: 'Larousse', numero_serie: 'SN-0082', estado: 'prestado', fecha_adquisicion: '2026-12-10', valor_aproximado: '450', vida_util: '48', cantidad_actual: '11', stock_minimo: '3', descripcion: 'Diccionario técnico para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 83, codigo_qr: 'CETI-SEN-083', nombre_item: 'Sensor de temperatura', id_categoria: 11, id_almacen: 9, modelo: 'Mod-718', marca: 'Steren', numero_serie: 'SN-0083', estado: 'en_uso', fecha_adquisicion: '2026-12-11', valor_aproximado: '250', vida_util: '36', cantidad_actual: '12', stock_minimo: '2', descripcion: 'Sensor de temperatura para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 84, codigo_qr: 'CETI-JUE-084', nombre_item: 'Juego de desarmadores', id_categoria: 12, id_almacen: 2, modelo: 'Mod-375', marca: 'Truper', numero_serie: 'SN-0084', estado: 'disponible', fecha_adquisicion: '2023-11-27', valor_aproximado: '6500', vida_util: '60', cantidad_actual: '15', stock_minimo: '5', descripcion: 'Juego de desarmadores para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 85, codigo_qr: 'CETI-LAP-085', nombre_item: 'Laptop Dell Inspiron', id_categoria: 1, id_almacen: 3, modelo: 'Mod-603', marca: 'Dell', numero_serie: 'SN-0085', estado: 'en_uso', fecha_adquisicion: '2026-11-27', valor_aproximado: '600', vida_util: '12', cantidad_actual: '8', stock_minimo: '3', descripcion: 'Laptop Dell Inspiron para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 86, codigo_qr: 'CETI-TRÍ-086', nombre_item: 'Trípode para cámara', id_categoria: 2, id_almacen: 6, modelo: 'Mod-810', marca: 'Manfrotto', numero_serie: 'SN-0086', estado: 'en_uso', fecha_adquisicion: '2024-06-14', valor_aproximado: '15800', vida_util: '48', cantidad_actual: '4', stock_minimo: '2', descripcion: 'Trípode para cámara para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 87, codigo_qr: 'CETI-ESC-087', nombre_item: 'Escritorio individual', id_categoria: 3, id_almacen: 11, modelo: 'Mod-891', marca: 'OfficeMax', numero_serie: 'SN-0087', estado: 'en_uso', fecha_adquisicion: '2025-06-04', valor_aproximado: '1500', vida_util: '48', cantidad_actual: '3', stock_minimo: '3', descripcion: 'Escritorio individual para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 88, codigo_qr: 'CETI-TER-088', nombre_item: 'Termómetro digital', id_categoria: 4, id_almacen: 1, modelo: 'Mod-610', marca: 'Fisher', numero_serie: 'SN-0088', estado: 'mantenimiento', fecha_adquisicion: '2025-10-25', valor_aproximado: '850', vida_util: '48', cantidad_actual: '4', stock_minimo: '3', descripcion: 'Termómetro digital para uso en prácticas del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 89, codigo_qr: 'CETI-PRE-089', nombre_item: 'Prensa hidráulica', id_categoria: 5, id_almacen: 1, modelo: 'Mod-745', marca: 'Truper', numero_serie: 'SN-0089', estado: 'disponible', fecha_adquisicion: '2026-02-01', valor_aproximado: '3500', vida_util: '60', cantidad_actual: '7', stock_minimo: '2', descripcion: 'Prensa hidráulica para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 90, codigo_qr: 'CETI-BAL-090', nombre_item: 'Balón de básquetbol', id_categoria: 6, id_almacen: 3, modelo: 'Mod-220', marca: 'Spalding', numero_serie: 'SN-0090', estado: 'disponible', fecha_adquisicion: '2024-02-15', valor_aproximado: '450', vida_util: '24', cantidad_actual: '2', stock_minimo: '3', descripcion: 'Balón de básquetbol para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 91, codigo_qr: 'CETI-TEN-091', nombre_item: 'Tensiómetro digital', id_categoria: 7, id_almacen: 5, modelo: 'Mod-248', marca: 'Omron', numero_serie: 'SN-0091', estado: 'en_uso', fecha_adquisicion: '2024-08-18', valor_aproximado: '3500', vida_util: '48', cantidad_actual: '13', stock_minimo: '5', descripcion: 'Tensiómetro digital para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 92, codigo_qr: 'CETI-CAR-092', nombre_item: 'Carro de limpieza', id_categoria: 8, id_almacen: 10, modelo: 'Mod-619', marca: 'Rubbermaid', numero_serie: 'SN-0092', estado: 'en_uso', fecha_adquisicion: '2026-06-26', valor_aproximado: '1200', vida_util: '36', cantidad_actual: '7', stock_minimo: '5', descripcion: 'Carro de limpieza para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 93, codigo_qr: 'CETI-ENG-093', nombre_item: 'Engargoladora', id_categoria: 9, id_almacen: 5, modelo: 'Mod-651', marca: 'GBC', numero_serie: 'SN-0093', estado: 'prestado', fecha_adquisicion: '2026-03-15', valor_aproximado: '8500', vida_util: '48', cantidad_actual: '12', stock_minimo: '2', descripcion: 'Engargoladora para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 94, codigo_qr: 'CETI-DIC-094', nombre_item: 'Diccionario técnico', id_categoria: 10, id_almacen: 6, modelo: 'Mod-685', marca: 'Larousse', numero_serie: 'SN-0094', estado: 'en_uso', fecha_adquisicion: '2024-12-08', valor_aproximado: '15800', vida_util: '48', cantidad_actual: '9', stock_minimo: '3', descripcion: 'Diccionario técnico para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 95, codigo_qr: 'CETI-RAS-095', nombre_item: 'Raspberry Pi 4', id_categoria: 11, id_almacen: 7, modelo: 'Mod-911', marca: 'Raspberry', numero_serie: 'SN-0095', estado: 'disponible', fecha_adquisicion: '2026-07-22', valor_aproximado: '22000', vida_util: '24', cantidad_actual: '14', stock_minimo: '2', descripcion: 'Raspberry Pi 4 para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 96, codigo_qr: 'CETI-PIN-096', nombre_item: 'Pinza de electricista', id_categoria: 12, id_almacen: 1, modelo: 'Mod-638', marca: 'Klein', numero_serie: 'SN-0096', estado: 'disponible', fecha_adquisicion: '2023-08-04', valor_aproximado: '15800', vida_util: '48', cantidad_actual: '9', stock_minimo: '3', descripcion: 'Pinza de electricista para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 97, codigo_qr: 'CETI-LAP-097', nombre_item: 'Laptop Dell Inspiron', id_categoria: 1, id_almacen: 3, modelo: 'Mod-809', marca: 'Dell', numero_serie: 'SN-0097', estado: 'en_uso', fecha_adquisicion: '2025-06-20', valor_aproximado: '3500', vida_util: '48', cantidad_actual: '7', stock_minimo: '5', descripcion: 'Laptop Dell Inspiron para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 98, codigo_qr: 'CETI-PAN-098', nombre_item: 'Pantalla de proyección', id_categoria: 2, id_almacen: 6, modelo: 'Mod-732', marca: 'Da-Lite', numero_serie: 'SN-0098', estado: 'mantenimiento', fecha_adquisicion: '2026-09-02', valor_aproximado: '8500', vida_util: '12', cantidad_actual: '9', stock_minimo: '3', descripcion: 'Pantalla de proyección para uso en clases del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 99, codigo_qr: 'CETI-LIB-099', nombre_item: 'Librero metálico', id_categoria: 3, id_almacen: 11, modelo: 'Mod-748', marca: 'Steelcase', numero_serie: 'SN-0099', estado: 'mantenimiento', fecha_adquisicion: '2026-02-25', valor_aproximado: '450', vida_util: '12', cantidad_actual: '14', stock_minimo: '2', descripcion: 'Librero metálico para uso en proyectos del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 100, codigo_qr: 'CETI-MEC-100', nombre_item: 'Mechero Bunsen', id_categoria: 4, id_almacen: 3, modelo: 'Mod-483', marca: 'Fisher', numero_serie: 'SN-0100', estado: 'prestado', fecha_adquisicion: '2023-05-12', valor_aproximado: '1500', vida_util: '48', cantidad_actual: '3', stock_minimo: '2', descripcion: 'Mechero Bunsen para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 101, codigo_qr: 'CETI-SOL-101', nombre_item: 'Soldadora eléctrica', id_categoria: 5, id_almacen: 4, modelo: 'Mod-991', marca: 'Lincoln', numero_serie: 'SN-0101', estado: 'en_uso', fecha_adquisicion: '2024-02-20', valor_aproximado: '600', vida_util: '48', cantidad_actual: '5', stock_minimo: '2', descripcion: 'Soldadora eléctrica para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 102, codigo_qr: 'CETI-CRO-102', nombre_item: 'Cronómetro deportivo', id_categoria: 6, id_almacen: 11, modelo: 'Mod-570', marca: 'Casio', numero_serie: 'SN-0102', estado: 'disponible', fecha_adquisicion: '2026-11-09', valor_aproximado: '850', vida_util: '36', cantidad_actual: '5', stock_minimo: '2', descripcion: 'Cronómetro deportivo para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 103, codigo_qr: 'CETI-BOT-103', nombre_item: 'Botiquín de primeros auxilios', id_categoria: 7, id_almacen: 8, modelo: 'Mod-754', marca: 'Cruz Roja', numero_serie: 'SN-0103', estado: 'disponible', fecha_adquisicion: '2025-10-10', valor_aproximado: '3500', vida_util: '48', cantidad_actual: '7', stock_minimo: '5', descripcion: 'Botiquín de primeros auxilios para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 104, codigo_qr: 'CETI-DIS-104', nombre_item: 'Dispensador de jabón', id_categoria: 8, id_almacen: 8, modelo: 'Mod-467', marca: 'Rubbermaid', numero_serie: 'SN-0104', estado: 'disponible', fecha_adquisicion: '2024-07-19', valor_aproximado: '450', vida_util: '60', cantidad_actual: '9', stock_minimo: '1', descripcion: 'Dispensador de jabón para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 105, codigo_qr: 'CETI-CAL-105', nombre_item: 'Calculadora científica', id_categoria: 9, id_almacen: 5, modelo: 'Mod-608', marca: 'Casio', numero_serie: 'SN-0105', estado: 'disponible', fecha_adquisicion: '2023-10-24', valor_aproximado: '6500', vida_util: '36', cantidad_actual: '6', stock_minimo: '5', descripcion: 'Calculadora científica para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 106, codigo_qr: 'CETI-MAN-106', nombre_item: 'Manual de electromecánica', id_categoria: 10, id_almacen: 10, modelo: 'Mod-838', marca: 'Editorial CETI', numero_serie: 'SN-0106', estado: 'baja', fecha_adquisicion: '2025-11-25', valor_aproximado: '6500', vida_util: '24', cantidad_actual: '6', stock_minimo: '2', descripcion: 'Manual de electromecánica para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 107, codigo_qr: 'CETI-PRO-107', nombre_item: 'Protoboard', id_categoria: 11, id_almacen: 11, modelo: 'Mod-192', marca: 'Steren', numero_serie: 'SN-0107', estado: 'mantenimiento', fecha_adquisicion: '2025-12-05', valor_aproximado: '250', vida_util: '36', cantidad_actual: '9', stock_minimo: '1', descripcion: 'Protoboard para uso en proyectos del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 108, codigo_qr: 'CETI-MAR-108', nombre_item: 'Martillo', id_categoria: 12, id_almacen: 7, modelo: 'Mod-944', marca: 'Truper', numero_serie: 'SN-0108', estado: 'disponible', fecha_adquisicion: '2025-03-09', valor_aproximado: '4800', vida_util: '48', cantidad_actual: '0', stock_minimo: '1', descripcion: 'Martillo para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 109, codigo_qr: 'CETI-TAB-109', nombre_item: 'Tablet educativa', id_categoria: 1, id_almacen: 5, modelo: 'Mod-792', marca: 'Lenovo', numero_serie: 'SN-0109', estado: 'prestado', fecha_adquisicion: '2024-04-28', valor_aproximado: '450', vida_util: '48', cantidad_actual: '10', stock_minimo: '2', descripcion: 'Tablet educativa para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 110, codigo_qr: 'CETI-CON-110', nombre_item: 'Consola de audio', id_categoria: 2, id_almacen: 2, modelo: 'Mod-788', marca: 'Yamaha', numero_serie: 'SN-0110', estado: 'baja', fecha_adquisicion: '2025-11-24', valor_aproximado: '3500', vida_util: '36', cantidad_actual: '2', stock_minimo: '2', descripcion: 'Consola de audio para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 111, codigo_qr: 'CETI-ARC-111', nombre_item: 'Archivero metálico', id_categoria: 3, id_almacen: 11, modelo: 'Mod-763', marca: 'Steelcase', numero_serie: 'SN-0111', estado: 'disponible', fecha_adquisicion: '2025-10-08', valor_aproximado: '250', vida_util: '12', cantidad_actual: '9', stock_minimo: '1', descripcion: 'Archivero metálico para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 112, codigo_qr: 'CETI-MEC-112', nombre_item: 'Mechero Bunsen', id_categoria: 4, id_almacen: 5, modelo: 'Mod-199', marca: 'Fisher', numero_serie: 'SN-0112', estado: 'mantenimiento', fecha_adquisicion: '2025-08-04', valor_aproximado: '250', vida_util: '24', cantidad_actual: '2', stock_minimo: '2', descripcion: 'Mechero Bunsen para uso en prácticas del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 113, codigo_qr: 'CETI-SIE-113', nombre_item: 'Sierra de banco', id_categoria: 5, id_almacen: 3, modelo: 'Mod-844', marca: 'DeWalt', numero_serie: 'SN-0113', estado: 'en_uso', fecha_adquisicion: '2026-10-24', valor_aproximado: '9800', vida_util: '24', cantidad_actual: '14', stock_minimo: '2', descripcion: 'Sierra de banco para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 114, codigo_qr: 'CETI-COL-114', nombre_item: 'Colchoneta de ejercicio', id_categoria: 6, id_almacen: 11, modelo: 'Mod-555', marca: 'Everlast', numero_serie: 'SN-0114', estado: 'disponible', fecha_adquisicion: '2025-04-15', valor_aproximado: '250', vida_util: '24', cantidad_actual: '7', stock_minimo: '2', descripcion: 'Colchoneta de ejercicio para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 115, codigo_qr: 'CETI-EXT-115', nombre_item: 'Extintor', id_categoria: 7, id_almacen: 2, modelo: 'Mod-294', marca: 'Amerex', numero_serie: 'SN-0115', estado: 'mantenimiento', fecha_adquisicion: '2023-07-09', valor_aproximado: '1500', vida_util: '12', cantidad_actual: '13', stock_minimo: '2', descripcion: 'Extintor para uso en proyectos del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 116, codigo_qr: 'CETI-TRA-116', nombre_item: 'Trapeador industrial', id_categoria: 8, id_almacen: 2, modelo: 'Mod-228', marca: 'Vileda', numero_serie: 'SN-0116', estado: 'mantenimiento', fecha_adquisicion: '2023-06-08', valor_aproximado: '250', vida_util: '60', cantidad_actual: '11', stock_minimo: '1', descripcion: 'Trapeador industrial para uso en prácticas del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 117, codigo_qr: 'CETI-GUI-117', nombre_item: 'Guillotina de papel', id_categoria: 9, id_almacen: 2, modelo: 'Mod-251', marca: 'Swingline', numero_serie: 'SN-0117', estado: 'baja', fecha_adquisicion: '2024-06-25', valor_aproximado: '15800', vida_util: '60', cantidad_actual: '7', stock_minimo: '3', descripcion: 'Guillotina de papel para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 118, codigo_qr: 'CETI-ENC-118', nombre_item: 'Enciclopedia técnica', id_categoria: 10, id_almacen: 5, modelo: 'Mod-466', marca: 'Editorial CETI', numero_serie: 'SN-0118', estado: 'disponible', fecha_adquisicion: '2023-03-01', valor_aproximado: '450', vida_util: '24', cantidad_actual: '4', stock_minimo: '1', descripcion: 'Enciclopedia técnica para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 119, codigo_qr: 'CETI-FUE-119', nombre_item: 'Fuente regulada 5V', id_categoria: 11, id_almacen: 1, modelo: 'Mod-587', marca: 'Steren', numero_serie: 'SN-0119', estado: 'disponible', fecha_adquisicion: '2023-12-03', valor_aproximado: '4800', vida_util: '48', cantidad_actual: '1', stock_minimo: '2', descripcion: 'Fuente regulada 5V para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 120, codigo_qr: 'CETI-CAJ-120', nombre_item: 'Caja de herramientas', id_categoria: 12, id_almacen: 6, modelo: 'Mod-987', marca: 'Truper', numero_serie: 'SN-0120', estado: 'en_uso', fecha_adquisicion: '2023-12-26', valor_aproximado: '6500', vida_util: '60', cantidad_actual: '3', stock_minimo: '3', descripcion: 'Caja de herramientas para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 121, codigo_qr: 'CETI-MOU-121', nombre_item: 'Mouse óptico', id_categoria: 1, id_almacen: 8, modelo: 'Mod-210', marca: 'Logitech', numero_serie: 'SN-0121', estado: 'mantenimiento', fecha_adquisicion: '2026-07-22', valor_aproximado: '15800', vida_util: '48', cantidad_actual: '0', stock_minimo: '1', descripcion: 'Mouse óptico para uso en laboratorio del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 122, codigo_qr: 'CETI-TRÍ-122', nombre_item: 'Trípode para cámara', id_categoria: 2, id_almacen: 2, modelo: 'Mod-699', marca: 'Manfrotto', numero_serie: 'SN-0122', estado: 'disponible', fecha_adquisicion: '2025-10-21', valor_aproximado: '600', vida_util: '60', cantidad_actual: '4', stock_minimo: '2', descripcion: 'Trípode para cámara para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 123, codigo_qr: 'CETI-BAN-123', nombre_item: 'Banco de laboratorio', id_categoria: 3, id_almacen: 7, modelo: 'Mod-818', marca: 'Herman Miller', numero_serie: 'SN-0123', estado: 'mantenimiento', fecha_adquisicion: '2026-02-26', valor_aproximado: '6500', vida_util: '12', cantidad_actual: '12', stock_minimo: '3', descripcion: 'Banco de laboratorio para uso en proyectos del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 124, codigo_qr: 'CETI-TER-124', nombre_item: 'Termómetro digital', id_categoria: 4, id_almacen: 4, modelo: 'Mod-847', marca: 'Fisher', numero_serie: 'SN-0124', estado: 'en_uso', fecha_adquisicion: '2026-07-14', valor_aproximado: '1500', vida_util: '12', cantidad_actual: '9', stock_minimo: '2', descripcion: 'Termómetro digital para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 125, codigo_qr: 'CETI-COM-125', nombre_item: 'Compresor de aire', id_categoria: 5, id_almacen: 7, modelo: 'Mod-951', marca: 'Truper', numero_serie: 'SN-0125', estado: 'disponible', fecha_adquisicion: '2026-02-03', valor_aproximado: '8500', vida_util: '12', cantidad_actual: '8', stock_minimo: '5', descripcion: 'Compresor de aire para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 126, codigo_qr: 'CETI-BAL-126', nombre_item: 'Balón de fútbol', id_categoria: 6, id_almacen: 7, modelo: 'Mod-675', marca: 'Wilson', numero_serie: 'SN-0126', estado: 'disponible', fecha_adquisicion: '2023-10-18', valor_aproximado: '4800', vida_util: '36', cantidad_actual: '8', stock_minimo: '5', descripcion: 'Balón de fútbol para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 127, codigo_qr: 'CETI-BOT-127', nombre_item: 'Botiquín de primeros auxilios', id_categoria: 7, id_almacen: 7, modelo: 'Mod-419', marca: 'Cruz Roja', numero_serie: 'SN-0127', estado: 'disponible', fecha_adquisicion: '2023-05-20', valor_aproximado: '15800', vida_util: '36', cantidad_actual: '12', stock_minimo: '5', descripcion: 'Botiquín de primeros auxilios para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 128, codigo_qr: 'CETI-ASP-128', nombre_item: 'Aspiradora industrial', id_categoria: 8, id_almacen: 10, modelo: 'Mod-669', marca: 'Karcher', numero_serie: 'SN-0128', estado: 'en_uso', fecha_adquisicion: '2023-06-28', valor_aproximado: '850', vida_util: '36', cantidad_actual: '9', stock_minimo: '1', descripcion: 'Aspiradora industrial para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 129, codigo_qr: 'CETI-ENG-129', nombre_item: 'Engargoladora', id_categoria: 9, id_almacen: 5, modelo: 'Mod-949', marca: 'GBC', numero_serie: 'SN-0129', estado: 'mantenimiento', fecha_adquisicion: '2023-10-22', valor_aproximado: '12500', vida_util: '36', cantidad_actual: '10', stock_minimo: '1', descripcion: 'Engargoladora para uso en laboratorio del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 130, codigo_qr: 'CETI-ENC-130', nombre_item: 'Enciclopedia técnica', id_categoria: 10, id_almacen: 3, modelo: 'Mod-246', marca: 'Editorial CETI', numero_serie: 'SN-0130', estado: 'disponible', fecha_adquisicion: '2023-03-28', valor_aproximado: '1500', vida_util: '60', cantidad_actual: '11', stock_minimo: '5', descripcion: 'Enciclopedia técnica para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 131, codigo_qr: 'CETI-CAU-131', nombre_item: 'Cautín de estaño', id_categoria: 11, id_almacen: 2, modelo: 'Mod-564', marca: 'Weller', numero_serie: 'SN-0131', estado: 'disponible', fecha_adquisicion: '2024-07-14', valor_aproximado: '450', vida_util: '36', cantidad_actual: '6', stock_minimo: '5', descripcion: 'Cautín de estaño para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 132, codigo_qr: 'CETI-LLA-132', nombre_item: 'Llave inglesa', id_categoria: 12, id_almacen: 6, modelo: 'Mod-261', marca: 'Truper', numero_serie: 'SN-0132', estado: 'disponible', fecha_adquisicion: '2023-01-05', valor_aproximado: '6500', vida_util: '60', cantidad_actual: '15', stock_minimo: '5', descripcion: 'Llave inglesa para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 133, codigo_qr: 'CETI-LAP-133', nombre_item: 'Laptop Dell Inspiron', id_categoria: 1, id_almacen: 11, modelo: 'Mod-320', marca: 'Dell', numero_serie: 'SN-0133', estado: 'disponible', fecha_adquisicion: '2026-07-09', valor_aproximado: '3500', vida_util: '60', cantidad_actual: '9', stock_minimo: '2', descripcion: 'Laptop Dell Inspiron para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 134, codigo_qr: 'CETI-PAN-134', nombre_item: 'Pantalla de proyección', id_categoria: 2, id_almacen: 6, modelo: 'Mod-415', marca: 'Da-Lite', numero_serie: 'SN-0134', estado: 'en_uso', fecha_adquisicion: '2026-09-22', valor_aproximado: '6500', vida_util: '12', cantidad_actual: '12', stock_minimo: '1', descripcion: 'Pantalla de proyección para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 135, codigo_qr: 'CETI-LIB-135', nombre_item: 'Librero metálico', id_categoria: 3, id_almacen: 7, modelo: 'Mod-435', marca: 'Steelcase', numero_serie: 'SN-0135', estado: 'mantenimiento', fecha_adquisicion: '2024-05-10', valor_aproximado: '850', vida_util: '12', cantidad_actual: '0', stock_minimo: '1', descripcion: 'Librero metálico para uso en proyectos del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 136, codigo_qr: 'CETI-MIC-136', nombre_item: 'Microscopio óptico', id_categoria: 4, id_almacen: 8, modelo: 'Mod-953', marca: 'Olympus', numero_serie: 'SN-0136', estado: 'prestado', fecha_adquisicion: '2024-09-18', valor_aproximado: '4800', vida_util: '36', cantidad_actual: '9', stock_minimo: '2', descripcion: 'Microscopio óptico para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 137, codigo_qr: 'CETI-TAL-137', nombre_item: 'Taladro de banco', id_categoria: 5, id_almacen: 7, modelo: 'Mod-539', marca: 'Bosch', numero_serie: 'SN-0137', estado: 'prestado', fecha_adquisicion: '2023-06-19', valor_aproximado: '22000', vida_util: '60', cantidad_actual: '9', stock_minimo: '1', descripcion: 'Taladro de banco para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 138, codigo_qr: 'CETI-COL-138', nombre_item: 'Colchoneta de ejercicio', id_categoria: 6, id_almacen: 11, modelo: 'Mod-951', marca: 'Everlast', numero_serie: 'SN-0138', estado: 'en_uso', fecha_adquisicion: '2024-10-15', valor_aproximado: '1500', vida_util: '36', cantidad_actual: '2', stock_minimo: '2', descripcion: 'Colchoneta de ejercicio para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 139, codigo_qr: 'CETI-BOT-139', nombre_item: 'Botiquín de primeros auxilios', id_categoria: 7, id_almacen: 7, modelo: 'Mod-417', marca: 'Cruz Roja', numero_serie: 'SN-0139', estado: 'disponible', fecha_adquisicion: '2023-07-28', valor_aproximado: '4800', vida_util: '36', cantidad_actual: '8', stock_minimo: '1', descripcion: 'Botiquín de primeros auxilios para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 140, codigo_qr: 'CETI-CAR-140', nombre_item: 'Carro de limpieza', id_categoria: 8, id_almacen: 6, modelo: 'Mod-844', marca: 'Rubbermaid', numero_serie: 'SN-0140', estado: 'baja', fecha_adquisicion: '2024-06-12', valor_aproximado: '4800', vida_util: '24', cantidad_actual: '1', stock_minimo: '1', descripcion: 'Carro de limpieza para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 141, codigo_qr: 'CETI-GUI-141', nombre_item: 'Guillotina de papel', id_categoria: 9, id_almacen: 2, modelo: 'Mod-743', marca: 'Swingline', numero_serie: 'SN-0141', estado: 'disponible', fecha_adquisicion: '2023-03-25', valor_aproximado: '600', vida_util: '48', cantidad_actual: '12', stock_minimo: '2', descripcion: 'Guillotina de papel para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 142, codigo_qr: 'CETI-ATL-142', nombre_item: 'Atlas de ingeniería', id_categoria: 10, id_almacen: 10, modelo: 'Mod-254', marca: 'Editorial CETI', numero_serie: 'SN-0142', estado: 'baja', fecha_adquisicion: '2025-11-11', valor_aproximado: '8500', vida_util: '48', cantidad_actual: '13', stock_minimo: '3', descripcion: 'Atlas de ingeniería para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 143, codigo_qr: 'CETI-PRO-143', nombre_item: 'Protoboard', id_categoria: 11, id_almacen: 8, modelo: 'Mod-175', marca: 'Steren', numero_serie: 'SN-0143', estado: 'en_uso', fecha_adquisicion: '2023-06-17', valor_aproximado: '6500', vida_util: '36', cantidad_actual: '10', stock_minimo: '5', descripcion: 'Protoboard para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 144, codigo_qr: 'CETI-PIN-144', nombre_item: 'Pinza de electricista', id_categoria: 12, id_almacen: 8, modelo: 'Mod-619', marca: 'Klein', numero_serie: 'SN-0144', estado: 'disponible', fecha_adquisicion: '2023-10-20', valor_aproximado: '450', vida_util: '48', cantidad_actual: '6', stock_minimo: '1', descripcion: 'Pinza de electricista para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 145, codigo_qr: 'CETI-ESC-145', nombre_item: 'Escáner de documentos', id_categoria: 1, id_almacen: 10, modelo: 'Mod-587', marca: 'Epson', numero_serie: 'SN-0145', estado: 'en_uso', fecha_adquisicion: '2024-06-20', valor_aproximado: '22000', vida_util: '60', cantidad_actual: '13', stock_minimo: '5', descripcion: 'Escáner de documentos para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 146, codigo_qr: 'CETI-BOC-146', nombre_item: 'Bocina portátil', id_categoria: 2, id_almacen: 1, modelo: 'Mod-276', marca: 'JBL', numero_serie: 'SN-0146', estado: 'en_uso', fecha_adquisicion: '2023-09-21', valor_aproximado: '9800', vida_util: '12', cantidad_actual: '7', stock_minimo: '1', descripcion: 'Bocina portátil para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 147, codigo_qr: 'CETI-LIB-147', nombre_item: 'Librero metálico', id_categoria: 3, id_almacen: 8, modelo: 'Mod-518', marca: 'Steelcase', numero_serie: 'SN-0147', estado: 'en_uso', fecha_adquisicion: '2025-05-13', valor_aproximado: '1500', vida_util: '36', cantidad_actual: '6', stock_minimo: '3', descripcion: 'Librero metálico para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 148, codigo_qr: 'CETI-MIC-148', nombre_item: 'Microscopio óptico', id_categoria: 4, id_almacen: 11, modelo: 'Mod-841', marca: 'Olympus', numero_serie: 'SN-0148', estado: 'mantenimiento', fecha_adquisicion: '2026-05-09', valor_aproximado: '4800', vida_util: '60', cantidad_actual: '2', stock_minimo: '2', descripcion: 'Microscopio óptico para uso en prácticas del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 149, codigo_qr: 'CETI-PRE-149', nombre_item: 'Prensa hidráulica', id_categoria: 5, id_almacen: 3, modelo: 'Mod-815', marca: 'Truper', numero_serie: 'SN-0149', estado: 'disponible', fecha_adquisicion: '2025-05-21', valor_aproximado: '22000', vida_util: '48', cantidad_actual: '4', stock_minimo: '1', descripcion: 'Prensa hidráulica para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 150, codigo_qr: 'CETI-BAL-150', nombre_item: 'Balón de básquetbol', id_categoria: 6, id_almacen: 10, modelo: 'Mod-819', marca: 'Spalding', numero_serie: 'SN-0150', estado: 'prestado', fecha_adquisicion: '2025-03-22', valor_aproximado: '8500', vida_util: '60', cantidad_actual: '8', stock_minimo: '1', descripcion: 'Balón de básquetbol para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 151, codigo_qr: 'CETI-BOT-151', nombre_item: 'Botiquín de primeros auxilios', id_categoria: 7, id_almacen: 11, modelo: 'Mod-449', marca: 'Cruz Roja', numero_serie: 'SN-0151', estado: 'mantenimiento', fecha_adquisicion: '2025-03-07', valor_aproximado: '1500', vida_util: '48', cantidad_actual: '3', stock_minimo: '2', descripcion: 'Botiquín de primeros auxilios para uso en proyectos del CETI.', observaciones: 'Requiere revisión técnica' },
    { id: 152, codigo_qr: 'CETI-CAR-152', nombre_item: 'Carro de limpieza', id_categoria: 8, id_almacen: 4, modelo: 'Mod-997', marca: 'Rubbermaid', numero_serie: 'SN-0152', estado: 'disponible', fecha_adquisicion: '2023-11-11', valor_aproximado: '4800', vida_util: '60', cantidad_actual: '1', stock_minimo: '1', descripcion: 'Carro de limpieza para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
    { id: 153, codigo_qr: 'CETI-GUI-153', nombre_item: 'Guillotina de papel', id_categoria: 9, id_almacen: 10, modelo: 'Mod-144', marca: 'Swingline', numero_serie: 'SN-0153', estado: 'en_uso', fecha_adquisicion: '2024-12-15', valor_aproximado: '12500', vida_util: '48', cantidad_actual: '13', stock_minimo: '1', descripcion: 'Guillotina de papel para uso en laboratorio del CETI.', observaciones: 'Sin observaciones' },
    { id: 154, codigo_qr: 'CETI-DIC-154', nombre_item: 'Diccionario técnico', id_categoria: 10, id_almacen: 11, modelo: 'Mod-344', marca: 'Larousse', numero_serie: 'SN-0154', estado: 'prestado', fecha_adquisicion: '2026-04-18', valor_aproximado: '1200', vida_util: '36', cantidad_actual: '11', stock_minimo: '1', descripcion: 'Diccionario técnico para uso en clases del CETI.', observaciones: 'Sin observaciones' },
    { id: 155, codigo_qr: 'CETI-PLA-155', nombre_item: 'Placa PCB perforada', id_categoria: 11, id_almacen: 4, modelo: 'Mod-640', marca: 'Steren', numero_serie: 'SN-0155', estado: 'disponible', fecha_adquisicion: '2025-07-17', valor_aproximado: '3500', vida_util: '48', cantidad_actual: '13', stock_minimo: '5', descripcion: 'Placa PCB perforada para uso en proyectos del CETI.', observaciones: 'Sin observaciones' },
    { id: 156, codigo_qr: 'CETI-LLA-156', nombre_item: 'Llave inglesa', id_categoria: 12, id_almacen: 4, modelo: 'Mod-205', marca: 'Truper', numero_serie: 'SN-0156', estado: 'baja', fecha_adquisicion: '2026-06-18', valor_aproximado: '250', vida_util: '60', cantidad_actual: '2', stock_minimo: '3', descripcion: 'Llave inglesa para uso en prácticas del CETI.', observaciones: 'Sin observaciones' },
  ],
  reportes: [
    { id: 1, codigo_reporte: 'RPT-20260127-001', titulo: 'Cambio de consumibles - Aspiradora industrial', id_item: 32, item: 'Aspiradora industrial', tipo_reporte: 'preventivo', prioridad: 'alta', estado: 'en_proceso', fecha_limite: '2026-08-02', reportado_por: 'Ana Torres', descripcion: 'Reporte de tipo preventivo para Aspiradora industrial en SN-0032.' },
    { id: 2, codigo_reporte: 'RPT-20260616-002', titulo: 'Limpieza y calibración - Webcam HD', id_item: 73, item: 'Webcam HD', tipo_reporte: 'mejora', prioridad: 'urgente', estado: 'pendiente', fecha_limite: '2026-07-01', reportado_por: 'Ana Torres', descripcion: 'Reporte de tipo mejora para Webcam HD en SN-0073.' },
    { id: 3, codigo_reporte: 'RPT-20260524-003', titulo: 'No enciende - Atlas de ingeniería', id_item: 22, item: 'Atlas de ingeniería', tipo_reporte: 'correctivo', prioridad: 'urgente', estado: 'pendiente', fecha_limite: '2026-09-08', reportado_por: 'Ana Torres', descripcion: 'Reporte de tipo correctivo para Atlas de ingeniería en SN-0022.' },
    { id: 4, codigo_reporte: 'RPT-20260214-004', titulo: 'Revisión periódica - Balón de básquetbol', id_item: 42, item: 'Balón de básquetbol', tipo_reporte: 'preventivo', prioridad: 'urgente', estado: 'pendiente', fecha_limite: '2026-07-27', reportado_por: 'Carlos Ruiz', descripcion: 'Reporte de tipo preventivo para Balón de básquetbol en SN-0042.' },
    { id: 5, codigo_reporte: 'RPT-20260605-005', titulo: 'Limpieza y calibración - Atlas de ingeniería', id_item: 70, item: 'Atlas de ingeniería', tipo_reporte: 'preventivo', prioridad: 'alta', estado: 'cancelado', fecha_limite: '2026-07-20', reportado_por: 'Ana Torres', descripcion: 'Reporte de tipo preventivo para Atlas de ingeniería en SN-0070.' },
    { id: 6, codigo_reporte: 'RPT-20260406-006', titulo: 'Ruido anormal en motor - Trapeador industrial', id_item: 116, item: 'Trapeador industrial', tipo_reporte: 'correctivo', prioridad: 'baja', estado: 'completado', fecha_limite: '2026-07-17', reportado_por: 'Sistema (automático)', descripcion: 'Reporte de tipo correctivo para Trapeador industrial en SN-0116.' },
    { id: 7, codigo_reporte: 'RPT-20260402-007', titulo: 'Actualización de software - Llave inglesa', id_item: 132, item: 'Llave inglesa', tipo_reporte: 'preventivo', prioridad: 'urgente', estado: 'completado', fecha_limite: '2026-09-24', reportado_por: 'Admin CETI', descripcion: 'Reporte de tipo preventivo para Llave inglesa en SN-0132.' },
    { id: 8, codigo_reporte: 'RPT-20260308-008', titulo: 'Revisión periódica - Consola de audio', id_item: 38, item: 'Consola de audio', tipo_reporte: 'general', prioridad: 'baja', estado: 'completado', fecha_limite: '2026-08-02', reportado_por: 'Ana Torres', descripcion: 'Reporte de tipo general para Consola de audio en SN-0038.' },
    { id: 9, codigo_reporte: 'RPT-20260615-009', titulo: 'Limpieza y calibración - Mechero Bunsen', id_item: 112, item: 'Mechero Bunsen', tipo_reporte: 'general', prioridad: 'urgente', estado: 'en_proceso', fecha_limite: '2026-08-03', reportado_por: 'Carlos Ruiz', descripcion: 'Reporte de tipo general para Mechero Bunsen en SN-0112.' },
    { id: 10, codigo_reporte: 'RPT-20260202-010', titulo: 'Cambio de consumibles - Pinza de electricista', id_item: 24, item: 'Pinza de electricista', tipo_reporte: 'preventivo', prioridad: 'media', estado: 'pendiente', fecha_limite: '2026-09-10', reportado_por: 'Sistema (automático)', descripcion: 'Reporte de tipo preventivo para Pinza de electricista en SN-0024.' },
    { id: 11, codigo_reporte: 'RPT-20260302-011', titulo: 'Actualización de software - Proyector de acetatos', id_item: 57, item: 'Proyector de acetatos', tipo_reporte: 'mejora', prioridad: 'media', estado: 'completado', fecha_limite: '2026-09-28', reportado_por: 'Admin CETI', descripcion: 'Reporte de tipo mejora para Proyector de acetatos en SN-0057.' },
    { id: 12, codigo_reporte: 'RPT-20260126-012', titulo: 'Cambio de consumibles - Botiquín de primeros auxilios', id_item: 151, item: 'Botiquín de primeros auxilios', tipo_reporte: 'general', prioridad: 'alta', estado: 'cancelado', fecha_limite: '2026-10-24', reportado_por: 'Carlos Ruiz', descripcion: 'Reporte de tipo general para Botiquín de primeros auxilios en SN-0151.' },
    { id: 13, codigo_reporte: 'RPT-20260216-013', titulo: 'Cambio de consumibles - Balón de básquetbol', id_item: 90, item: 'Balón de básquetbol', tipo_reporte: 'mejora', prioridad: 'urgente', estado: 'completado', fecha_limite: '2026-11-09', reportado_por: 'Admin CETI', descripcion: 'Reporte de tipo mejora para Balón de básquetbol en SN-0090.' },
    { id: 14, codigo_reporte: 'RPT-20260420-014', titulo: 'Revisión periódica - Tensiómetro digital', id_item: 7, item: 'Tensiómetro digital', tipo_reporte: 'mejora', prioridad: 'media', estado: 'completado', fecha_limite: '2026-09-04', reportado_por: 'Admin CETI', descripcion: 'Reporte de tipo mejora para Tensiómetro digital en SN-0007.' },
    { id: 15, codigo_reporte: 'RPT-20260315-015', titulo: 'Cambio de consumibles - Protoboard', id_item: 107, item: 'Protoboard', tipo_reporte: 'general', prioridad: 'urgente', estado: 'en_proceso', fecha_limite: '2026-12-15', reportado_por: 'Ana Torres', descripcion: 'Reporte de tipo general para Protoboard en SN-0107.' },
    { id: 16, codigo_reporte: 'RPT-20260628-016', titulo: 'Revisión periódica - Trípode para cámara', id_item: 14, item: 'Trípode para cámara', tipo_reporte: 'mejora', prioridad: 'alta', estado: 'cancelado', fecha_limite: '2026-09-21', reportado_por: 'Admin CETI', descripcion: 'Reporte de tipo mejora para Trípode para cámara en SN-0014.' },
    { id: 17, codigo_reporte: 'RPT-20260317-017', titulo: 'Actualización de software - Cronómetro deportivo', id_item: 102, item: 'Cronómetro deportivo', tipo_reporte: 'preventivo', prioridad: 'media', estado: 'pendiente', fecha_limite: '2026-08-28', reportado_por: 'Sistema (automático)', descripcion: 'Reporte de tipo preventivo para Cronómetro deportivo en SN-0102.' },
    { id: 18, codigo_reporte: 'RPT-20260203-018', titulo: 'Revisión periódica - Engargoladora', id_item: 129, item: 'Engargoladora', tipo_reporte: 'mejora', prioridad: 'media', estado: 'completado', fecha_limite: '2026-09-13', reportado_por: 'Sistema (automático)', descripcion: 'Reporte de tipo mejora para Engargoladora en SN-0129.' },
    { id: 19, codigo_reporte: 'RPT-20260615-019', titulo: 'Limpieza y calibración - Pinza de electricista', id_item: 96, item: 'Pinza de electricista', tipo_reporte: 'preventivo', prioridad: 'alta', estado: 'completado', fecha_limite: '2026-10-25', reportado_por: 'Admin CETI', descripcion: 'Reporte de tipo preventivo para Pinza de electricista en SN-0096.' },
    { id: 20, codigo_reporte: 'RPT-20260313-020', titulo: 'Ruido anormal en motor - Tablet educativa', id_item: 61, item: 'Tablet educativa', tipo_reporte: 'correctivo', prioridad: 'alta', estado: 'completado', fecha_limite: '2026-08-04', reportado_por: 'Admin CETI', descripcion: 'Reporte de tipo correctivo para Tablet educativa en SN-0061.' },
    { id: 21, codigo_reporte: 'RPT-20260513-021', titulo: 'Fuga detectada - Librero metálico', id_item: 99, item: 'Librero metálico', tipo_reporte: 'correctivo', prioridad: 'baja', estado: 'completado', fecha_limite: '2026-09-23', reportado_por: 'Carlos Ruiz', descripcion: 'Reporte de tipo correctivo para Librero metálico en SN-0099.' },
    { id: 22, codigo_reporte: 'RPT-20260323-022', titulo: 'Ruido anormal en motor - Destructora de papel', id_item: 21, item: 'Destructora de papel', tipo_reporte: 'correctivo', prioridad: 'urgente', estado: 'en_proceso', fecha_limite: '2026-07-05', reportado_por: 'Admin CETI', descripcion: 'Reporte de tipo correctivo para Destructora de papel en SN-0021.' },
    { id: 23, codigo_reporte: 'RPT-20260615-023', titulo: 'Limpieza y calibración - Colchoneta de ejercicio', id_item: 138, item: 'Colchoneta de ejercicio', tipo_reporte: 'mejora', prioridad: 'baja', estado: 'completado', fecha_limite: '2026-12-12', reportado_por: 'Admin CETI', descripcion: 'Reporte de tipo mejora para Colchoneta de ejercicio en SN-0138.' },
    { id: 24, codigo_reporte: 'RPT-20260223-024', titulo: 'Cambio de consumibles - Enciclopedia técnica', id_item: 58, item: 'Enciclopedia técnica', tipo_reporte: 'general', prioridad: 'media', estado: 'completado', fecha_limite: '2026-11-08', reportado_por: 'Admin CETI', descripcion: 'Reporte de tipo general para Enciclopedia técnica en SN-0058.' },
  ],
};

// Cambiar este número cada vez que se actualicen los datos de ejemplo
// (defaultData / defaultUsersPlain). Si el navegador tiene guardada una
// versión anterior, los datos se reemplazan automáticamente al cargar.
const SEED_VERSION = '4';
const SEED_VERSION_KEY = 'ceti_seed_version';

async function ensureDefaults() {
  const storedVersion = localStorage.getItem(SEED_VERSION_KEY);
  if (storedVersion !== SEED_VERSION) {
    // Datos de una versión anterior de la demo: se limpian para poder
    // sembrar los datos de ejemplo actualizados (almacenes, categorías,
    // items, usuarios y reportes).
    Object.values(STORAGE_KEYS).forEach((storageKey) => localStorage.removeItem(storageKey));
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
  }

  // Usuarios: se hashean las contraseñas por defecto la primera vez.
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    const usersHashed = [];
    for (const u of defaultUsersPlain) {
      usersHashed.push({ ...u, contrasena: await hashPassword(u.contrasena) });
    }
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(usersHashed));
  }
  Object.entries(defaultData).forEach(([key, value]) => {
    const storageKey = STORAGE_KEYS[key] || key;
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(value));
    }
  });
}

/* ---------- Restablecer datos de ejemplo manualmente (botón en login) ---------- */
function initResetDemoButton() {
  const btn = document.getElementById('btn-reset-demo');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (!confirm('Esto borrará todos los datos actuales (usuarios, almacenes, categorías, items y reportes) y los reemplazará con los datos de ejemplo. ¿Continuar?')) return;
    Object.values(STORAGE_KEYS).forEach((storageKey) => localStorage.removeItem(storageKey));
    localStorage.removeItem(SEED_VERSION_KEY);
    window.location.reload();
  });
}

function getData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function getModuleData(moduleName) {
  const key = STORAGE_KEYS[moduleName] || moduleName;
  return getData(key);
}
function saveModuleData(moduleName, data) {
  const key = STORAGE_KEYS[moduleName] || moduleName;
  saveData(key, data);
}
function getNextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

/* ---------- Resolución de nombres relacionados ---------- */
function getCategoriaNombre(id) {
  const cat = getModuleData('categorias').find((c) => String(c.id) === String(id));
  return cat ? cat.nombre : 'Sin categoría';
}
function getAlmacenNombre(id) {
  const alm = getModuleData('almacenes').find((a) => String(a.id) === String(id));
  return alm ? alm.nombre : 'Sin almacén';
}
function getItemById(id) {
  return getModuleData('items').find((i) => String(i.id) === String(id));
}
function getItemByCodigo(codigo) {
  return getModuleData('items').find((i) => i.codigo_qr === codigo);
}
function getItemNombre(id) {
  const item = getItemById(id);
  return item ? item.nombre_item : 'Sin item asociado';
}
function getUsuarioActual() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.auth));
  } catch {
    return null;
  }
}

/* ---------- Generación automática de códigos (equivalente PHP) ---------- */
function generateQRCode(nombreItem) {
  const existentes = new Set(getModuleData('items').map((i) => i.codigo_qr));
  const prefix = (nombreItem || 'ITM').replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');
  let code;
  let attempts = 0;
  do {
    const now = new Date();
    const stamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0') +
      String(attempts || '');
    code = `CETI-${prefix}-${stamp}`;
    attempts++;
  } while (existentes.has(code)); // RNF10: nunca generar un código QR duplicado
  return code;
}
function generateReportCode() {
  const existentes = new Set(getModuleData('reportes').map((r) => r.codigo_reporte));
  let code;
  do {
    const now = new Date();
    const stamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    code = `RPT-${stamp}-${rand}`;
  } while (existentes.has(code));
  return code;
}

/* ---------- Trigger: mantenimiento preventivo automático (RF13) ---------- */
function crearReportePreventivoAutomatico(item) {
  const reportes = getModuleData('reportes');
  const nuevoReporte = {
    id: getNextId(reportes),
    codigo_reporte: generateReportCode(),
    titulo: `Mantenimiento preventivo inicial - ${item.nombre_item}`,
    id_item: item.id,
    item: item.nombre_item,
    tipo_reporte: 'preventivo',
    prioridad: 'baja',
    estado: 'pendiente',
    fecha_limite: '',
    reportado_por: 'Sistema (automático)',
    descripcion: 'Reporte generado automáticamente al registrar el item en el sistema.'
  };
  reportes.push(nuevoReporte);
  saveModuleData('reportes', reportes);
}

/* ---------- RI06: mensajes flash tras acciones (equivalente a $_SESSION['success']) ---------- */
function setFlash(message, type) {
  sessionStorage.setItem('ceti_flash', JSON.stringify({ message, type: type || 'success' }));
}
function showFlash() {
  const raw = sessionStorage.getItem('ceti_flash');
  if (!raw) return;
  sessionStorage.removeItem('ceti_flash');
  let flash;
  try { flash = JSON.parse(raw); } catch { return; }
  const main = document.querySelector('main');
  if (!main) return;
  const div = document.createElement('div');
  div.className = `alert alert-${flash.type} alert-dismissible fade show`;
  div.innerHTML = `${escapeHtml(flash.message)} <button type="button" class="btn-close" data-bs-dismiss="alert" onclick="this.parentElement.remove()"></button>`;
  const heading = main.querySelector('.border-bottom') || main.querySelector('h1');
  if (heading && heading.parentElement === main) {
    heading.insertAdjacentElement('afterend', div);
  } else {
    main.insertBefore(div, main.firstChild);
  }
}

/* ---------- Poblar <select> dinámicamente ---------- */
function populateSelect(select, list, valueKey, labelKey, selectedValue) {
  if (!select) return;
  const placeholder = select.dataset.placeholder || 'Seleccionar...';
  select.innerHTML = `<option value="">${placeholder}</option>` +
    list.map((item) => `<option value="${item[valueKey]}" ${String(item[valueKey]) === String(selectedValue) ? 'selected' : ''}>${escapeHtml(item[labelKey])}</option>`).join('');
}
function populateFilterSelect(select, list, valueKey, labelKey, allLabel) {
  if (!select) return;
  select.innerHTML = `<option value="">${allLabel}</option>` +
    list.map((item) => `<option value="${item[valueKey]}">${escapeHtml(item[labelKey])}</option>`).join('');
}
function populateModuleSelects(moduleName, form, currentValues) {
  if (moduleName === 'items') {
    populateSelect(form.elements['id_categoria'], getModuleData('categorias'), 'id', 'nombre', currentValues && currentValues.id_categoria);
    populateSelect(form.elements['id_almacen'], getModuleData('almacenes'), 'id', 'nombre', currentValues && currentValues.id_almacen);
  }
  if (moduleName === 'reportes') {
    populateSelect(form.elements['id_item'], getModuleData('items'), 'id', 'nombre_item', currentValues && currentValues.id_item);
  }
}

/* ---------- Dashboard ---------- */
function renderDashboard() {
  const totalItems = document.getElementById('total-items');
  const availableItems = document.getElementById('available-items');
  const pendingReports = document.getElementById('pending-reports');
  const lowStock = document.getElementById('low-stock');
  const tableBody = document.getElementById('recent-items');

  if (!totalItems && !tableBody) return;

  const items = getModuleData('items');
  const reports = getModuleData('reportes');
  const available = items.filter((item) => item.estado === 'disponible').length;
  const pending = reports.filter((report) => report.estado === 'pendiente').length;
  // RF08: alertas de stock mínimo
  const stockBajo = items.filter((item) => Number(item.cantidad_actual) <= Number(item.stock_minimo)).length;

  if (totalItems) totalItems.textContent = items.length;
  if (availableItems) availableItems.textContent = available;
  if (pendingReports) pendingReports.textContent = pending;
  if (lowStock) lowStock.textContent = stockBajo;

  if (tableBody) {
    const recientes = [...items].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 5);
    tableBody.innerHTML = recientes.map((item) => `
        <tr>
          <td><code>${escapeHtml(item.codigo_qr)}</code></td>
          <td>${escapeHtml(item.nombre_item)}</td>
          <td>${escapeHtml(getCategoriaNombre(item.id_categoria))}</td>
          <td>${escapeHtml(getAlmacenNombre(item.id_almacen))}</td>
          <td>${estadoBadge(item.estado)}</td>
          <td>${escapeHtml(item.fecha_adquisicion) || '--'}</td>
        </tr>
      `).join('');
  }
}

function estadoBadge(estado) {
  const map = {
    disponible: 'bg-success', en_uso: 'bg-primary', mantenimiento: 'bg-warning text-dark',
    prestado: 'bg-info text-dark', baja: 'bg-danger', pendiente: 'bg-secondary',
    en_proceso: 'bg-warning text-dark', completado: 'bg-success', cancelado: 'bg-danger'
  };
  const cls = map[estado] || 'bg-secondary';
  const label = (estado || '').replace(/_/g, ' ');
  return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
}

/* ---------- Listados ---------- */
function renderList(moduleName, filters) {
  const tbody = document.getElementById(`${moduleName}-list`);
  if (!tbody) return;

  let rows = getModuleData(moduleName);
  rows = applyFilters(moduleName, rows, filters);

  let html = '';

  switch (moduleName) {
    case 'usuarios':
      html = rows.map((row) => `
        <tr>
          <td>${row.id}</td>
          <td>${escapeHtml(row.usuario)}</td>
          <td>${escapeHtml(row.nombre_completo)}</td>
          <td><span class="badge bg-danger">${escapeHtml(row.rol)}</span></td>
          <td>${escapeHtml(row.email)}</td>
          <td>
            <span class="badge ${row.estado === 'Activo' ? 'bg-success' : 'bg-secondary'}" style="cursor:pointer" data-toggle-estado="true" data-id="${row.id}" title="Clic para activar/desactivar">${row.estado}</span>
          </td>
          <td>${escapeHtml(row.ultimo_acceso) || 'Nunca'}</td>
          <td>
            <a href="usuarios-editar.html?id=${row.id}" class="btn btn-warning btn-sm">Editar</a>
            <a href="#" class="btn btn-danger btn-sm" data-delete="true" data-id="${row.id}">Eliminar</a>
          </td>
        </tr>`).join('');
      break;
    case 'almacenes':
      html = rows.map((row) => `
        <tr>
          <td><code>${escapeHtml(row.codigo)}</code></td>
          <td>${escapeHtml(row.nombre)}</td>
          <td>${escapeHtml(row.ubicacion)}</td>
          <td>${escapeHtml(row.capacidad)}</td>
          <td>${escapeHtml(row.responsable)}</td>
          <td>${escapeHtml(row.telefono)}</td>
          <td><span class="badge bg-success">${escapeHtml(row.estado)}</span></td>
          <td>
            <a href="almacenes-editar.html?id=${row.id}" class="btn btn-warning btn-sm">Editar</a>
            <a href="#" class="btn btn-danger btn-sm" data-delete="true" data-id="${row.id}">Eliminar</a>
          </td>
        </tr>`).join('');
      break;
    case 'categorias':
      html = rows.map((row) => `
        <tr>
          <td><code>${escapeHtml(row.codigo)}</code></td>
          <td>${escapeHtml(row.nombre)}</td>
          <td><span class="badge" style="background:${escapeHtml(row.color)};color:white;">${escapeHtml(row.color)}</span></td>
          <td>${escapeHtml(row.descripcion)}</td>
          <td><span class="badge bg-success">${escapeHtml(row.estado)}</span></td>
          <td>
            <a href="categorias-editar.html?id=${row.id}" class="btn btn-warning btn-sm">Editar</a>
            <a href="#" class="btn btn-danger btn-sm" data-delete="true" data-id="${row.id}">Eliminar</a>
          </td>
        </tr>`).join('');
      break;
    case 'items':
      html = rows.map((row) => {
        const stockBajo = Number(row.cantidad_actual) <= Number(row.stock_minimo);
        return `
        <tr class="${stockBajo ? 'table-danger' : ''}">
          <td><code>${escapeHtml(row.codigo_qr)}</code></td>
          <td>${escapeHtml(row.nombre_item)}</td>
          <td>${escapeHtml(getCategoriaNombre(row.id_categoria))}</td>
          <td>${escapeHtml(getAlmacenNombre(row.id_almacen))}</td>
          <td><small>${escapeHtml(row.modelo || '')}${row.modelo && row.marca ? '<br/>' : ''}${escapeHtml(row.marca || '')}</small></td>
          <td>${estadoBadge(row.estado)} ${stockBajo ? '<span class="badge bg-danger" title="Stock igual o menor al mínimo">⚠ Stock bajo</span>' : ''}</td>
          <td>${row.cantidad_actual ?? '--'} / ${row.stock_minimo ?? '--'} <small class="text-muted">(min)</small></td>
          <td>$${Number(row.valor_aproximado || 0).toLocaleString()}</td>
          <td>
            <a href="item-qr.html?id=${row.id}" class="btn btn-outline-secondary btn-sm">Ver QR</a>
            <a href="items-editar.html?id=${row.id}" class="btn btn-warning btn-sm">Editar</a>
            <a href="#" class="btn btn-danger btn-sm" data-delete="true" data-id="${row.id}">Eliminar</a>
          </td>
        </tr>`;
      }).join('');
      break;
    case 'reportes':
      html = rows.map((row) => `
        <tr>
          <td><code>${escapeHtml(row.codigo_reporte)}</code></td>
          <td>${escapeHtml(row.titulo)}</td>
          <td>${escapeHtml(row.id_item ? getItemNombre(row.id_item) : (row.item || 'N/A'))}</td>
          <td>${escapeHtml(row.tipo_reporte)}</td>
          <td><span class="badge bg-warning text-dark">${escapeHtml(row.prioridad)}</span></td>
          <td>${estadoBadge(row.estado)}</td>
          <td>${escapeHtml(row.reportado_por) || 'Admin CETI'}</td>
          <td>${escapeHtml(row.fecha_limite) || '--'}</td>
          <td>
            <a href="reportes-editar.html?id=${row.id}" class="btn btn-warning btn-sm">Editar</a>
            <a href="#" class="btn btn-danger btn-sm" data-delete="true" data-id="${row.id}">Eliminar</a>
          </td>
        </tr>`).join('');
      break;
  }

  tbody.innerHTML = html || `<tr><td colspan="10" class="text-center text-muted py-4">Sin resultados.</td></tr>`;

  tbody.querySelectorAll('[data-delete="true"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();

      const id = button.getAttribute('data-id');

      // RF06: no permitir eliminar un item si tiene reportes de
      // mantenimiento activos (pendientes o en proceso).
      if (moduleName === 'items') {
        const reportesActivos = getModuleData('reportes').filter((r) =>
          String(r.id_item) === String(id) && ['pendiente', 'en_proceso'].includes(r.estado));
        if (reportesActivos.length > 0) {
          alert(`No se puede eliminar este item: tiene ${reportesActivos.length} reporte(s) de mantenimiento activo(s). Ciérralos primero desde el módulo de Reportes.`);
          return;
        }
      }

      if (!confirm('¿Estás seguro de eliminar este registro?')) return;
      const updated = getModuleData(moduleName).filter((item) => String(item.id) !== String(id));
      saveModuleData(moduleName, updated);
      setFlash('Registro eliminado exitosamente.', 'success');
      renderList(moduleName, filters);
      showFlash();
    });
  });

  tbody.querySelectorAll('[data-toggle-estado="true"]').forEach((badge) => {
    badge.addEventListener('click', () => {
      const id = badge.getAttribute('data-id');
      const users = getModuleData('usuarios');
      const idx = users.findIndex((u) => String(u.id) === String(id));
      if (idx >= 0) {
        users[idx].estado = users[idx].estado === 'Activo' ? 'Inactivo' : 'Activo';
        saveModuleData('usuarios', users);
        renderList('usuarios', filters);
      }
    });
  });
}

/* ---------- Filtros y búsqueda ---------- */
function applyFilters(moduleName, rows, filters) {
  if (!filters) return rows;
  const { search, categoria, estado, tipo, prioridad, almacen } = filters;

  return rows.filter((row) => {
    let ok = true;
    if (search) {
      const s = search.toLowerCase();
      if (moduleName === 'items') {
        ok = ok && ((row.nombre_item || '').toLowerCase().includes(s) ||
                     (row.codigo_qr || '').toLowerCase().includes(s) ||
                     (row.descripcion || '').toLowerCase().includes(s));
      } else if (moduleName === 'reportes') {
        ok = ok && ((row.titulo || '').toLowerCase().includes(s) ||
                     (row.codigo_reporte || '').toLowerCase().includes(s));
      } else if (moduleName === 'usuarios') {
        ok = ok && ((row.usuario || '').toLowerCase().includes(s) ||
                     (row.nombre_completo || '').toLowerCase().includes(s));
      } else if (moduleName === 'almacenes' || moduleName === 'categorias') {
        ok = ok && ((row.nombre || '').toLowerCase().includes(s));
      }
    }
    if (categoria) ok = ok && String(row.id_categoria) === String(categoria);
    if (almacen) ok = ok && String(row.id_almacen) === String(almacen);
    if (estado) ok = ok && row.estado === estado;
    if (tipo) ok = ok && row.tipo_reporte === tipo;
    if (prioridad) ok = ok && row.prioridad === prioridad;
    return ok;
  });
}

function initFilters(moduleName) {
  const form = document.getElementById('filter-form');
  if (!form) {
    renderList(moduleName, {});
    return;
  }

  const searchInput = form.elements['search'];
  const categoriaSelect = form.elements['categoria'];
  const almacenSelect = form.elements['almacen'];
  const estadoSelect = form.elements['estado'];
  const tipoSelect = form.elements['tipo'];
  const prioridadSelect = form.elements['prioridad'];

  if (categoriaSelect) {
    populateFilterSelect(categoriaSelect, getModuleData('categorias'), 'id', 'nombre', 'Todas las categorías');
  }
  if (almacenSelect) {
    populateFilterSelect(almacenSelect, getModuleData('almacenes'), 'id', 'nombre', 'Todos los almacenes');
  }

  const readFilters = () => ({
    search: searchInput ? searchInput.value.trim() : '',
    categoria: categoriaSelect ? categoriaSelect.value : '',
    almacen: almacenSelect ? almacenSelect.value : '',
    estado: estadoSelect ? estadoSelect.value : '',
    tipo: tipoSelect ? tipoSelect.value : '',
    prioridad: prioridadSelect ? prioridadSelect.value : ''
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    renderList(moduleName, readFilters());
  });

  const clearBtn = form.querySelector('[data-clear]');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      form.reset();
      renderList(moduleName, {});
    });
  }

  renderList(moduleName, readFilters());
}

/* ---------- RI05: validación de campos obligatorios con mensajes en español ---------- */
function applySpanishValidationMessages(form) {
  const messages = {
    valueMissing: 'Este campo es obligatorio.',
    typeMismatch: 'El formato de este campo no es válido.',
    tooShort: 'El valor es demasiado corto.',
    tooLong: 'El valor es demasiado largo.'
  };
  Array.from(form.elements).forEach((el) => {
    if (!el.willValidate) return;
    el.addEventListener('invalid', () => {
      if (el.validity.valueMissing) el.setCustomValidity(messages.valueMissing);
      else if (el.validity.typeMismatch) el.setCustomValidity(messages.typeMismatch);
      else if (el.validity.tooShort) el.setCustomValidity(messages.tooShort);
      else if (el.validity.tooLong) el.setCustomValidity(messages.tooLong);
      else el.setCustomValidity('Revisa este campo.');
    });
    el.addEventListener('input', () => el.setCustomValidity(''));
    el.addEventListener('change', () => el.setCustomValidity(''));
  });
}

/* ---------- Formularios (crear / editar) ---------- */
function populateForm(moduleName, form) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    populateModuleSelects(moduleName, form, {});
    if (moduleName === 'items') {
      const qrField = form.elements['codigo_qr'];
      if (qrField) { qrField.value = '(se genera automáticamente al guardar)'; qrField.setAttribute('readonly', 'readonly'); }
    }
    if (moduleName === 'reportes') {
      const codeField = form.elements['codigo_reporte'];
      if (codeField) { codeField.value = '(se genera automáticamente al guardar)'; codeField.setAttribute('readonly', 'readonly'); }
    }
    return;
  }

  const rows = getModuleData(moduleName);
  const row = rows.find((item) => String(item.id) === String(id));
  if (!row) return;

  populateModuleSelects(moduleName, form, row);

  Object.entries(row).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field && field.tagName !== 'SELECT') {
      field.value = value;
    }
  });

  // Por seguridad nunca se precarga la contraseña existente en el formulario.
  if (form.elements['contrasena']) form.elements['contrasena'].value = '';
}

async function handleModuleForm(moduleName) {
  const form = document.getElementById('module-form');
  if (!form) return;

  applySpanishValidationMessages(form);
  populateForm(moduleName, form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const rows = getModuleData(moduleName);
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // RNF03: nunca almacenar contraseñas en texto plano.
    if (moduleName === 'usuarios') {
      if (payload.contrasena) {
        payload.contrasena = await hashPassword(payload.contrasena);
      } else {
        delete payload.contrasena; // en edición, si se deja en blanco no se cambia
      }
    }

    let successMsg = '';

    if (id) {
      const index = rows.findIndex((item) => String(item.id) === String(id));
      if (index >= 0) {
        rows[index] = { ...rows[index], ...payload, id: Number(id) };
        if (moduleName === 'reportes' && payload.id_item) {
          rows[index].item = getItemNombre(payload.id_item);
        }
      }
      saveModuleData(moduleName, rows);
      successMsg = 'Registro actualizado exitosamente.';
    } else {
      const nuevo = { ...payload, id: getNextId(rows) };

      if (moduleName === 'items') {
        nuevo.codigo_qr = generateQRCode(payload.nombre_item);
        if (nuevo.cantidad_actual === undefined || nuevo.cantidad_actual === '') nuevo.cantidad_actual = '1';
        if (nuevo.stock_minimo === undefined || nuevo.stock_minimo === '') nuevo.stock_minimo = '1';
      }
      if (moduleName === 'reportes') {
        nuevo.codigo_reporte = generateReportCode();
        if (payload.id_item) nuevo.item = getItemNombre(payload.id_item);
        const currentUser = getUsuarioActual();
        nuevo.reportado_por = currentUser ? currentUser.nombre : 'Admin CETI';
      }
      if (moduleName === 'usuarios') {
        nuevo.ultimo_acceso = 'Nunca';
        if (!nuevo.estado) nuevo.estado = 'Activo';
      }

      rows.push(nuevo);
      saveModuleData(moduleName, rows);

      if (moduleName === 'items') {
        crearReportePreventivoAutomatico(nuevo);
        successMsg = `Item creado exitosamente con código QR: ${nuevo.codigo_qr}`;
      } else if (moduleName === 'reportes') {
        successMsg = `Reporte creado exitosamente con código: ${nuevo.codigo_reporte}`;
      } else {
        successMsg = 'Registro creado exitosamente.';
      }
    }

    setFlash(successMsg, 'success');
    window.location.href = `${moduleName}.html`;
  });
}

/* ---------- Login (RF01, RF02, RNF03) ---------- */
function handleLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    const hashed = await hashPassword(contrasena);
    const users = getModuleData('usuarios');
    const match = users.find((user) => user.usuario === usuario && user.contrasena === hashed);

    if (!match) {
      alert('Usuario o contraseña incorrectos');
      return;
    }
    if (match.estado === 'Inactivo') {
      alert('Este usuario está desactivado. Contacta al administrador.');
      return;
    }

    match.ultimo_acceso = new Date().toLocaleString('es-MX');
    saveModuleData('usuarios', users);

    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify({ id: match.id, usuario: match.usuario, nombre: match.nombre_completo, rol: match.rol }));
    window.location.href = window.location.pathname.includes('/modulos/') ? '../dashboard.html' : 'dashboard.html';
  });
}

/* ---------- Sesión: nombre de usuario y control por rol (RI02, RI03) ---------- */
function applySessionUI() {
  const user = getUsuarioActual();
  const navText = document.querySelector('.navbar-text');
  if (navText && user) {
    navText.textContent = `${user.nombre} (${user.rol})`;
  }
  if (user && user.rol && user.rol !== 'admin') {
    document.querySelectorAll('a[href$="usuarios.html"], a[href$="modulos/usuarios.html"]').forEach((link) => {
      const li = link.closest('li');
      if (li) li.style.display = 'none';
    });
  }
}

/* ---------- Perfil de usuario ---------- */
function initPerfilPage() {
  const form = document.getElementById('perfil-form');
  if (!form) return;

  const user = getUsuarioActual();
  if (!user) {
    window.location.href = '../index.html';
    return;
  }
  const users = getModuleData('usuarios');
  const current = users.find((u) => String(u.id) === String(user.id));
  if (!current) return;

  applySpanishValidationMessages(form);

  form.elements['usuario'].value = current.usuario;
  form.elements['nombre_completo'].value = current.nombre_completo;
  form.elements['email'].value = current.email;
  form.elements['rol'].value = current.rol;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const idx = users.findIndex((u) => String(u.id) === String(current.id));
    users[idx].nombre_completo = form.elements['nombre_completo'].value;
    users[idx].email = form.elements['email'].value;
    const nuevaContrasena = form.elements['contrasena'].value;
    if (nuevaContrasena) {
      users[idx].contrasena = await hashPassword(nuevaContrasena);
    }
    saveModuleData('usuarios', users);

    const authData = { ...user, nombre: users[idx].nombre_completo };
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(authData));

    const msg = document.getElementById('perfil-msg');
    if (msg) {
      msg.classList.remove('d-none');
      msg.textContent = 'Perfil actualizado exitosamente.';
    }
    form.elements['contrasena'].value = '';
  });

  initBackupTools();
}

/* ---------- RNF11: respaldo manual (export / import) de la base de datos ---------- */
function initBackupTools() {
  const exportBtn = document.getElementById('btn-export-backup');
  const importInput = document.getElementById('input-import-backup');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const backup = {};
      Object.entries(STORAGE_KEYS).forEach(([, storageKey]) => {
        backup[storageKey] = getData(storageKey);
      });
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fecha = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `ceti-almacen-respaldo-${fecha}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!confirm('Esto reemplazará todos los datos actuales con los del respaldo. ¿Continuar?')) return;
          Object.entries(data).forEach(([key, value]) => saveData(key, value));
          alert('Respaldo restaurado exitosamente. La página se recargará.');
          window.location.reload();
        } catch (err) {
          alert('El archivo de respaldo no es válido.');
        }
      };
      reader.readAsText(file);
    });
  }
}

/* ============================================================
   RF09 / RI04 / Flujo de escaneo: vista pública del item por QR
   (ver.html, en la raíz de web/, sin necesidad de iniciar sesión)
   ============================================================ */
function initPublicView() {
  const container = document.getElementById('public-view-container');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const codigo = params.get('codigo');
  const item = codigo ? getItemByCodigo(codigo) : null;

  if (!item) {
    container.innerHTML = `
      <div class="alert alert-danger text-center">
        <h4>Item no encontrado</h4>
        <p class="mb-0">El código <code>${escapeHtml(codigo || '')}</code> no corresponde a ningún item registrado.</p>
      </div>`;
    return;
  }

  const stockBajo = Number(item.cantidad_actual) <= Number(item.stock_minimo);

  container.innerHTML = `
    <div class="card shadow-sm">
      <div class="card-body text-center">
        <h3 class="mb-1">${escapeHtml(item.nombre_item)}</h3>
        <p class="text-muted mb-3"><code>${escapeHtml(item.codigo_qr)}</code></p>
        <div class="row text-start mt-3">
          <div class="col-6 mb-3"><strong>Categoría</strong><br>${escapeHtml(getCategoriaNombre(item.id_categoria))}</div>
          <div class="col-6 mb-3"><strong>Almacén</strong><br>${escapeHtml(getAlmacenNombre(item.id_almacen))}</div>
          <div class="col-6 mb-3"><strong>Estado</strong><br>${estadoBadge(item.estado)}</div>
          <div class="col-6 mb-3"><strong>Stock</strong><br>${item.cantidad_actual ?? '--'} unidades ${stockBajo ? '<span class="badge bg-danger">⚠ Bajo mínimo</span>' : ''}</div>
        </div>
      </div>
    </div>
    <div id="public-view-actions" class="mt-3"></div>
    <div id="public-view-historial" class="mt-3"></div>
  `;

  const user = getUsuarioActual();
  const actionsDiv = document.getElementById('public-view-actions');
  const isModulosPath = window.location.pathname.includes('/modulos/');

  if (!user) {
    // Flujo: ¿Sesión iniciada? -> No -> Redirigir a formulario de login
    actionsDiv.innerHTML = `
      <div class="alert alert-info text-center">
        Inicia sesión para registrar un reporte, editar este item o ver su historial de mantenimiento.
        <br><a href="index.html" class="btn btn-primary btn-sm mt-2">Iniciar sesión</a>
      </div>`;
    return;
  }

  // Flujo: ¿Sesión iniciada? -> Sí -> Mostrar acciones
  actionsDiv.innerHTML = `
    <div class="d-flex gap-2 flex-wrap justify-content-center">
      <a href="modulos/reportes-crear.html?id_item=${item.id}" class="btn btn-success btn-sm">Registrar reporte de mantenimiento</a>
      <a href="modulos/items-editar.html?id=${item.id}" class="btn btn-warning btn-sm">Editar item</a>
      <a href="modulos/item-qr.html?id=${item.id}" class="btn btn-outline-secondary btn-sm">Ver / imprimir QR</a>
    </div>`;

  const historial = getModuleData('reportes').filter((r) => String(r.id_item) === String(item.id));
  const historialDiv = document.getElementById('public-view-historial');
  historialDiv.innerHTML = `
    <h6 class="mt-4">Historial de mantenimiento (${historial.length})</h6>
    ${historial.length === 0 ? '<p class="text-muted">Sin reportes registrados para este item.</p>' : `
    <ul class="list-group">
      ${historial.map((r) => `<li class="list-group-item d-flex justify-content-between align-items-center">
        <span>${escapeHtml(r.titulo)} <small class="text-muted">(${escapeHtml(r.tipo_reporte)})</small></span>
        ${estadoBadge(r.estado)}
      </li>`).join('')}
    </ul>`}
  `;
}

/* ---------- Generación real de código QR (canvas) — item-qr.html ---------- */
function initQrPage() {
  const canvas = document.getElementById('qr-canvas');
  if (!canvas) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const item = getItemById(id);

  if (!item) {
    document.getElementById('qr-container').innerHTML = '<div class="alert alert-danger">Item no encontrado.</div>';
    return;
  }

  // El QR codifica la URL pública de consulta (ver.html), para que al
  // escanearlo con cualquier cámara se abra la vista pública del item
  // sin necesidad de iniciar sesión (RF09 / RI04).
  const baseUrl = window.location.href.split('/modulos/')[0];
  const publicUrl = `${baseUrl}/ver.html?codigo=${encodeURIComponent(item.codigo_qr)}`;

  document.getElementById('item-nombre').textContent = item.nombre_item;
  document.getElementById('item-codigo').textContent = item.codigo_qr;
  document.getElementById('item-categoria').textContent = getCategoriaNombre(item.id_categoria);
  document.getElementById('item-almacen').textContent = getAlmacenNombre(item.id_almacen);
  document.getElementById('item-estado').innerHTML = estadoBadge(item.estado);
  document.getElementById('qr-data').value = publicUrl;

  function renderQR() {
    if (typeof QRious === 'undefined') {
      document.getElementById('qr-container').innerHTML =
        '<div class="alert alert-warning">No se pudo cargar la librería de generación de QR (se requiere conexión a internet la primera vez). Mientras tanto, el código de identificación es: <strong>' + item.codigo_qr + '</strong></div>';
      return;
    }
    new QRious({ element: canvas, value: publicUrl, size: 260, level: 'H', background: 'white', foreground: 'black' });
  }
  renderQR();

  const downloadBtn = document.getElementById('btn-download-qr');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.download = `qr_${item.codigo_qr}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
  const printBtn = document.getElementById('btn-print-qr');
  if (printBtn) printBtn.addEventListener('click', () => window.print());

  const copyBtn = document.getElementById('btn-copy-qr');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(publicUrl).then(() => alert('Enlace copiado al portapapeles')).catch(() => {});
    });
  }
}

/* ---------- Generar Reporte imprimible (equivalente a generar_reportes.php) ---------- */
function initGenerarReportePage() {
  const form = document.getElementById('generar-reporte-form');
  const resultTable = document.getElementById('reporte-resultado');
  if (!form || !resultTable) return;

  populateFilterSelect(form.elements['almacen'], getModuleData('almacenes'), 'id', 'nombre', 'Todos los almacenes');
  populateFilterSelect(form.elements['categoria'], getModuleData('categorias'), 'id', 'nombre', 'Todas las categorías');

  function generar() {
    const almacen = form.elements['almacen'].value;
    const categoria = form.elements['categoria'].value;
    const estado = form.elements['estado'].value;

    let items = getModuleData('items');
    if (almacen) items = items.filter((i) => String(i.id_almacen) === String(almacen));
    if (categoria) items = items.filter((i) => String(i.id_categoria) === String(categoria));
    if (estado) items = items.filter((i) => i.estado === estado);

    document.getElementById('reporte-fecha').textContent = new Date().toLocaleString('es-MX');
    document.getElementById('reporte-total').textContent = items.length;

    resultTable.innerHTML = items.map((item) => `
      <tr>
        <td>${escapeHtml(item.codigo_qr)}</td>
        <td>${escapeHtml(item.nombre_item)}</td>
        <td>${escapeHtml(getCategoriaNombre(item.id_categoria))}</td>
        <td>${escapeHtml(getAlmacenNombre(item.id_almacen))}</td>
        <td>${escapeHtml((item.estado || '').replace(/_/g, ' '))}</td>
        <td>$${Number(item.valor_aproximado || 0).toLocaleString()}</td>
      </tr>
    `).join('') || '<tr><td colspan="6" class="text-center text-muted">Sin resultados para estos filtros.</td></tr>';
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); generar(); });
  document.getElementById('btn-print-reporte').addEventListener('click', () => window.print());

  generar();
}

/* ---------- Boot ---------- */
async function boot() {
  await ensureDefaults();
  handleLogin();
  applySessionUI();
  renderDashboard();
  initQrPage();
  initPerfilPage();
  initGenerarReportePage();
  initPublicView();
  initResetDemoButton();
  showFlash();

  const body = document.body;
  const moduleName = body.getAttribute('data-module');

  if (moduleName && moduleName !== 'dashboard') {
    if (body.getAttribute('data-action') === 'list') {
      initFilters(moduleName);
    } else if (body.getAttribute('data-action') === 'create' || body.getAttribute('data-action') === 'edit') {
      // Si venimos de "Registrar reporte" desde la vista pública, precargar el item
      if (moduleName === 'reportes') {
        const params = new URLSearchParams(window.location.search);
        const idItemPre = params.get('id_item');
        if (idItemPre && !params.get('id')) {
          setTimeout(() => {
            const form = document.getElementById('module-form');
            if (form && form.elements['id_item']) form.elements['id_item'].value = idItemPre;
          }, 0);
        }
      }
      handleModuleForm(moduleName);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => { boot(); });
