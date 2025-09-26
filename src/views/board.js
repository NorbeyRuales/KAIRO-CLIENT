import { getTasks, deleteTask } from '../services/taskService.js';
import { showToast } from '../api/utils/helpers.js';

export function initBoard() {
  // ---- Elementos base ----
  const logoutBtn = document.getElementById('logoutBtn');
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');

  // Vieja lista (la forzamos oculta para que no vuelva a aparecer)
  const notesList = document.getElementById('notesList');
  const emptyState = document.getElementById('emptyState');

  const createBtn = document.getElementById('createBtn');
  const calendarBtn = document.getElementById('calendarBtn');

  // ---- Grid y columnas nuevas ----
  const grid = document.querySelector('#homePage .k-board-grid');
  const todoList = document.getElementById('todoList');
  const doingList = document.getElementById('doingList');
  const doneList = document.getElementById('doneList');

  const todoCount = document.getElementById('todoCount');
  const doingCount = document.getElementById('doingCount');
  const doneCount = document.getElementById('doneCount');

  const emptyTodo = document.getElementById('emptyTodo');
  const emptyDoing = document.getElementById('emptyDoing');
  const emptyDone = document.getElementById('emptyDone');

  const listView = document.getElementById('listView');
  const tpl = document.getElementById('noteItemTemplate');

  if (!logoutBtn || !grid || !todoList || !doingList || !doneList) return;

  if (notesList) notesList.remove();
  if (listView)  listView.remove(); 
  if (emptyState) emptyState.hidden = true;

  // ---- Estado local ----
  let allTasks = [];
  let currentFilter = '';
  let listMode = window.matchMedia('(max-width: 768px)').matches; // por defecto en móviles

  // ---- Utilidades ----
  const norm = (s = '') => String(s || '').toLowerCase();
  const statusKey = (s = '') => {
    const t = norm(s);
    if (t === 'doing' || t === 'en progreso' || t === 'en_progreso') return 'doing';
    if (t === 'done' || t === 'completada' || t === 'completo') return 'done';
    return 'todo';
  };
  const statusLabel = k => k === 'doing' ? 'En progreso' : k === 'done' ? 'Completada' : 'Pendiente';
  const parseDT = (t = {}) => new Date(`${t.date || '2100-01-01'}T${(t.time || '00:00')}:00`);
  const fmtDT = (t = {}) => {
    if (!t.date) return '';
    const d = parseDT(t);
    // DD/MM HH:mm
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm} ${hh}:${mi}`;
  };

  function clearLists() {
    todoList.innerHTML = '';
    doingList.innerHTML = '';
    doneList.innerHTML = '';
  }

  function syncCounts() {
    const nTodo = todoList.children.length;
    const nDoing = doingList.children.length;
    const nDone = doneList.children.length;

    todoCount.textContent = nTodo;
    doingCount.textContent = nDoing;
    doneCount.textContent = nDone;

    emptyTodo.hidden = nTodo > 0;
    emptyDoing.hidden = nDoing > 0;
    emptyDone.hidden = nDone > 0;
  }

  function makeItem(task) {
    const id = task._id || task.id || '';
    const title = task.title ?? task.name ?? task.detail ?? '(Sin título)';
    const stKey = statusKey(task.status);

    if (tpl && tpl.content && tpl.content.firstElementChild) {
      const li = tpl.content.firstElementChild.cloneNode(true);
      li.dataset.id = id;
      li.classList.remove('is-todo', 'is-doing', 'is-done');
      li.classList.add('is-' + stKey);
      li.querySelector('.kairo-chip__text').textContent = title;
      const meta = li.querySelector('.kairo-chip__meta');
      meta.textContent = `${fmtDT(task)}${task.status ? ` • ${statusLabel(stKey)}` : ''}`;
      return { li, stKey };
    }

    // Fallback si no existe el template
    const li = document.createElement('li');
    li.dataset.id = id;
    li.className = `kairo-note is-${stKey}`;
    li.innerHTML = `
      <button class="kairo-chip" data-action="edit" aria-label="Editar nota">
        <span class="kairo-chip__text">${title}</span>
        <small class="kairo-chip__meta">${fmtDT(task)}${task.status ? ` • ${statusLabel(stKey)}` : ''}</small>
      </button>
      <button class="kairo-chip__action" data-action="delete" aria-label="Eliminar nota">
        <span class="icon icon--trash" aria-hidden="true"></span>
      </button>`;
    return { li, stKey };
  }

  // ---- Render Kanban ----
  function renderBoard(tasks = []) {
    clearLists();
    tasks.forEach(task => {
      const { li, stKey } = makeItem(task);
      if (stKey === 'doing') doingList.appendChild(li);
      else if (stKey === 'done') doneList.appendChild(li);
      else todoList.appendChild(li);
    });
    syncCounts();
  }

  // ---- Render Lista (orden fecha asc) ----
  function renderList(tasks = []) {
    listView.innerHTML = '';
    const sorted = [...tasks].sort((a, b) => parseDT(a) - parseDT(b));
    sorted.forEach(task => {
      const { li } = makeItem(task); // reusa el mismo chip
      listView.appendChild(li);
    });
  }

  function applyView(tasks) {
    if (listMode) {
      grid.hidden = true;
      listView.hidden = false;
      renderList(tasks);
    } else {
      listView.hidden = true;
      grid.hidden = false;
      renderBoard(tasks);
    }
  }

  function renderFiltered() {
    const f = norm(currentFilter);
    const filtered = !f
      ? allTasks
      : allTasks.filter(t => norm(t.title || t.name || t.detail).includes(f));
    applyView(filtered);
  }

  async function loadTasks() {
    try {
      const t0 = performance.now();
      const res = await getTasks();
      const dt = performance.now() - t0;
      if (dt > 500) console.warn(`⚠️ GET /tasks tardó ${Math.round(dt)} ms`);

      const arr = Array.isArray(res) ? res : (res?.tasks || res?.data || []);
      allTasks = Array.isArray(arr) ? arr : [];
      renderFiltered();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error al cargar notas');
    }
  }

  async function removeTask(id) {
    try {
      await deleteTask(id);
      allTasks = allTasks.filter(t => (t._id || t.id) !== id);
      renderFiltered();
      showToast('Nota eliminada 🗑️');
      // notificar a quien escuche
      window.dispatchEvent(new CustomEvent('tasks:changed', { detail: { type: 'delete', id } }));
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error al eliminar');
    }
  }

  // ====== BÚSQUEDA PLEGABLE EN TOPBAR ======
  const isExpanded = () => !searchForm.classList.contains('is-compact');

  function openSearch() {
    if (isExpanded()) return;
    searchForm.classList.remove('is-compact');
    searchBtn.setAttribute('aria-expanded', 'true');
    setTimeout(() => searchInput.focus(), 10);
  }

  function closeSearch({ clearIfEmpty = true } = {}) {
    if (!isExpanded()) return;
    if (clearIfEmpty && !searchInput.value.trim()) {
      searchForm.classList.add('is-compact');
      searchBtn.setAttribute('aria-expanded', 'false');
      currentFilter = '';
      renderFiltered();
    }
  }

  searchForm.addEventListener('submit', (e) => e.preventDefault());

  searchBtn.addEventListener('click', () => {
    if (!isExpanded()) { openSearch(); return; }
    const q = searchInput.value.trim();
    if (!q) { closeSearch({ clearIfEmpty: true }); }
    else { currentFilter = norm(q); renderFiltered(); }
  });

  searchInput.addEventListener('input', (e) => {
    currentFilter = norm(e.target.value);
    renderFiltered();
  });

  document.addEventListener('click', (e) => {
    if (!searchForm.contains(e.target) && isExpanded()) closeSearch({ clearIfEmpty: true });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch({ clearIfEmpty: true });
  });
  // ====== FIN BÚSQUEDA ======

  // ---- Logout ----
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    showToast('Sesión cerrada 👋');
    location.hash = '#/login';
  });

  // ---- Menú perfil ----
  profileBtn.addEventListener('click', () => {
    const expanded = profileBtn.getAttribute('aria-expanded') === 'true';
    profileBtn.setAttribute('aria-expanded', String(!expanded));
    profileMenu.hidden = expanded;
  });

  // ---- Crear ----
  createBtn.addEventListener('click', () => { location.hash = '#/tasks/new'; });

  // ---- Calendario ----
  calendarBtn.addEventListener('click', () => {
    showToast('Aquí abrirías el calendario 📅');
  });

  // ---- Delegación de eventos en el grid/lista (editar / eliminar) ----
  function onClickList(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const li = btn.closest('.kairo-note');
    const id = li?.dataset.id;
    if (!id) return;

    if (btn.dataset.action === 'edit') {
      location.hash = `#/task/edit/${id}`;
      return;
    }
    if (btn.dataset.action === 'delete') {
      if (!confirm('¿Eliminar esta nota?')) return;
      removeTask(id);
    }
  }
  grid.addEventListener('click', onClickList);
  listView.addEventListener('click', onClickList);

  // ---- Escuchar cambios globales (crear/editar desde otras vistas) ----
  window.addEventListener('tasks:changed', (e) => {
    const { type, task, id } = e.detail || {};
    if (type === 'upsert' && task) {
      const tid = task._id || task.id;
      const idx = allTasks.findIndex(t => (t._id || t.id) === tid);
      if (idx >= 0) allTasks[idx] = { ...allTasks[idx], ...task };
      else allTasks.push(task);
      renderFiltered();
    } else if (type === 'delete' && id) {
      allTasks = allTasks.filter(t => (t._id || t.id) !== id);
      renderFiltered();
    }
  });

  // ---- Cambiar vista automáticamente por tamaño ----
  const mql = window.matchMedia('(max-width: 768px)');
  const onMedia = () => { listMode = mql.matches; renderFiltered(); };
  mql.addEventListener?.('change', onMedia);
  // ---- Init ----
  loadTasks();
  onMedia();
}
