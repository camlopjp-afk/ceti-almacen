const STORAGE_KEYS = {
  auth: 'ceti_auth',
  users: 'ceti_users',
  usuarios: 'ceti_users',
  almacenes: 'ceti_almacenes',
  categorias: 'ceti_categorias',
  items: 'ceti_items',
  reportes: 'ceti_reportes'
};

const defaultData = {
  users: [
    { id: 1, usuario: 'admin', nombre_completo: 'Admin CETI', email: 'admin@ceti.com', rol: 'admin', contrasena: 'admin123', estado: 'Activo', ultimo_acceso: '02/07/2026 12:00' }
  ],
  almacenes: [
    { id: 1, codigo: 'ALM-001', nombre: 'Almacén Principal', ubicacion: 'Planta Baja', capacidad: '500', responsable: 'Juan Pérez', telefono: '333-123-4567', estado: 'Activo' }
  ],
  categorias: [
    { id: 1, codigo: 'CAT-001', nombre: 'Tecnología', color: '#2563eb', descripcion: 'Equipos electrónicos', estado: 'Activa' }
  ],
  items: [
    { id: 1, codigo_qr: 'CETI-LAP-202607021200', nombre_item: 'Laptop Dell', id_categoria: 1, id_almacen: 1, modelo: 'Inspiron', marca: 'Dell', numero_serie: 'SN-001', estado: 'disponible', fecha_adquisicion: '2026-07-02', valor_aproximado: '12500', vida_util: '24', descripcion: 'Equipo portátil', observaciones: 'Sin observaciones' }
  ],
  reportes: [
    { id: 1, codigo_reporte: 'REP-001', titulo: 'Falla de monitor', item: 'Monitor 24"', tipo_reporte: 'correctivo', prioridad: 'alta', estado: 'pendiente', descripcion: 'Se detectó fallo de imagen' }
  ]
};

function ensureDefaults() {
  Object.entries(defaultData).forEach(([key, value]) => {
    const storageKey = STORAGE_KEYS[key] || key;
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(value));
    }
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

function renderDashboard() {
  const totalItems = document.getElementById('total-items');
  const availableItems = document.getElementById('available-items');
  const pendingReports = document.getElementById('pending-reports');
  const lowStock = document.getElementById('low-stock');
  const tableBody = document.getElementById('recent-items');

  const items = getModuleData('items');
  const reports = getModuleData('reportes');
  const available = items.filter((item) => item.estado === 'disponible').length;
  const pending = reports.filter((report) => report.estado === 'pendiente').length;

  if (totalItems) totalItems.textContent = items.length;
  if (availableItems) availableItems.textContent = available;
  if (pendingReports) pendingReports.textContent = pending;
  if (lowStock) lowStock.textContent = Math.max(0, items.length - available);

  if (tableBody) {
    tableBody.innerHTML = items.slice(0, 5).map((item) => {
      const badge = item.estado === 'disponible'
        ? '<span class="badge bg-success">disponible</span>'
        : item.estado === 'en_uso'
          ? '<span class="badge bg-primary">en uso</span>'
          : '<span class="badge bg-warning text-dark">mantenimiento</span>';

      return `
        <tr>
          <td>${item.codigo_qr}</td>
          <td>${item.nombre_item}</td>
          <td>${item.id_categoria || 'Sin categoría'}</td>
          <td>${item.id_almacen || 'Sin almacén'}</td>
          <td>${badge}</td>
          <td>${item.fecha_adquisicion || '--'}</td>
        </tr>
      `;
    }).join('');
  }
}

function renderList(moduleName) {
  const tbody = document.getElementById(`${moduleName}-list`);
  if (!tbody) return;

  const rows = getModuleData(moduleName);
  let html = '';

  switch (moduleName) {
    case 'usuarios':
      html = rows.map((row) => `
        <tr>
          <td>${row.id}</td>
          <td>${row.usuario}</td>
          <td>${row.nombre_completo}</td>
          <td><span class="badge bg-danger">${row.rol}</span></td>
          <td>${row.email}</td>
          <td><span class="badge bg-success">${row.estado}</span></td>
          <td>${row.ultimo_acceso || 'Nunca'}</td>
          <td>
            <a href="usuarios-editar.html?id=${row.id}" class="btn btn-warning btn-sm">Editar</a>
            <a href="#" class="btn btn-danger btn-sm" data-delete="true" data-id="${row.id}">Eliminar</a>
          </td>
        </tr>`).join('');
      break;
    case 'almacenes':
      html = rows.map((row) => `
        <tr>
          <td><code>${row.codigo}</code></td>
          <td>${row.nombre}</td>
          <td>${row.ubicacion}</td>
          <td>${row.capacidad}</td>
          <td>${row.responsable}</td>
          <td>${row.telefono}</td>
          <td><span class="badge bg-success">${row.estado}</span></td>
          <td>
            <a href="almacenes-editar.html?id=${row.id}" class="btn btn-warning btn-sm">Editar</a>
            <a href="#" class="btn btn-danger btn-sm" data-delete="true" data-id="${row.id}">Eliminar</a>
          </td>
        </tr>`).join('');
      break;
    case 'categorias':
      html = rows.map((row) => `
        <tr>
          <td><code>${row.codigo}</code></td>
          <td>${row.nombre}</td>
          <td><span class="badge" style="background:${row.color};color:white;">${row.color}</span></td>
          <td>${row.descripcion}</td>
          <td><span class="badge bg-success">${row.estado}</span></td>
          <td>02/07/2026</td>
          <td>
            <a href="categorias-editar.html?id=${row.id}" class="btn btn-warning btn-sm">Editar</a>
            <a href="#" class="btn btn-danger btn-sm" data-delete="true" data-id="${row.id}">Eliminar</a>
          </td>
        </tr>`).join('');
      break;
    case 'items':
      html = rows.map((row) => `
        <tr>
          <td><code>${row.codigo_qr}</code></td>
          <td>${row.nombre_item}</td>
          <td>${row.id_categoria || 'Sin categoría'}</td>
          <td>${row.id_almacen || 'Sin almacén'}</td>
          <td><small>${row.modelo}<br/>${row.marca}</small></td>
          <td><span class="badge bg-success">${row.estado}</span></td>
          <td>$${Number(row.valor_aproximado || 0).toLocaleString()}</td>
          <td>
            <a href="items-editar.html?id=${row.id}" class="btn btn-warning btn-sm">Editar</a>
            <a href="#" class="btn btn-danger btn-sm" data-delete="true" data-id="${row.id}">Eliminar</a>
          </td>
        </tr>`).join('');
      break;
    case 'reportes':
      html = rows.map((row) => `
        <tr>
          <td><code>${row.codigo_reporte}</code></td>
          <td>${row.titulo}</td>
          <td>${row.item}</td>
          <td>${row.tipo_reporte}</td>
          <td><span class="badge bg-warning text-dark">${row.prioridad}</span></td>
          <td><span class="badge bg-secondary">${row.estado}</span></td>
          <td>Admin CETI</td>
          <td>02/07/2026</td>
          <td>
            <a href="reportes-editar.html?id=${row.id}" class="btn btn-warning btn-sm">Editar</a>
            <a href="#" class="btn btn-danger btn-sm" data-delete="true" data-id="${row.id}">Eliminar</a>
          </td>
        </tr>`).join('');
      break;
  }

  tbody.innerHTML = html;

  tbody.querySelectorAll('[data-delete="true"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const id = Number(button.getAttribute('data-id'));
      const updated = getModuleData(moduleName).filter((item) => Number(item.id) !== id);
      saveModuleData(moduleName, updated);
      renderList(moduleName);
    });
  });
}

function populateForm(moduleName, form) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  const rows = getModuleData(moduleName);
  const row = rows.find((item) => String(item.id) === String(id));
  if (!row) return;

  Object.entries(row).forEach(([key, value]) => {
    const field = form.elements[key];
    if (field) {
      field.value = value;
    }
  });
}

function handleModuleForm(moduleName) {
  const form = document.getElementById('module-form');
  if (!form) return;

  populateForm(moduleName, form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const rows = getModuleData(moduleName);
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (id) {
      const index = rows.findIndex((item) => String(item.id) === String(id));
      if (index >= 0) {
        rows[index] = { ...rows[index], ...payload, id: Number(id) };
      }
    } else {
      rows.push({ ...payload, id: getNextId(rows) });
    }

    saveModuleData(moduleName, rows);
    window.location.href = `${moduleName}.html`;
  });
}

function handleLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const usuario = document.getElementById('usuario').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    const users = getModuleData('usuarios');
    const match = users.find((user) => user.usuario === usuario && user.contrasena === contrasena);

    if (match) {
      localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify({ usuario: match.usuario, nombre: match.nombre_completo }));
      window.location.href = 'dashboard.html';
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  });
}

function boot() {
  ensureDefaults();
  handleLogin();
  renderDashboard();

  const body = document.body;
  const moduleName = body.getAttribute('data-module');

  if (moduleName) {
    if (body.getAttribute('data-action') === 'list') {
      renderList(moduleName);
    } else {
      handleModuleForm(moduleName);
    }
  }
}

window.addEventListener('DOMContentLoaded', boot);
