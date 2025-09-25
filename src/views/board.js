import { getTasks, deleteTask } from '../services/taskService.js';
import { showToast } from '../api/utils/helpers.js';

export function initBoard() {
  // ---- Elementos base ----
  const logoutBtn   = document.getElementById('logoutBtn');
  const searchForm  = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const searchBtn   = document.getElementById('searchBtn');

  const profileBtn  = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');

  // Vieja lista (la forzamos oculta para que no vuelva a aparecer)
  const notesList   = document.getElementById('notesList');
  const emptyState  = document.getElementById('emptyState');

  const createBtn   = document.getElementById('createBtn');
  const calendarBtn = document.getElementById('calendarBtn');

  // ---- Grid y columnas nuevas ----
  const grid        = document.querySelector('#homePage .k-board-grid');
  const todoList    = document.getElementById('todoList');
  const doingList   = document.getElementById('doingList');
  const doneList    = document.getElementById('doneList');

  const todoCount   = document.getElementById('todoCount');
  const doingCount  = document.getElementById('doingCount');
  const doneCount   = document.getElementById('doneCount');

  const emptyTodo   = document.getElementById('emptyTodo');
  const emptyDoing  = document.getElementById('emptyDoing');
  const emptyDone   = document.getElementById('emptyDone');

  const tpl         = document.getElementById('noteItemTemplate');

  // Si faltan elementos esenciales, abortamos
  if (!logoutBtn || !grid || !todoList || !doingList || !doneList) return;

  // Siempre oculta la lista vieja
  if (notesList) notesList.hidden = true;
  if (emptyState) emptyState.hidden = true;

  // ---- Estado local ----
  let allTasks = [];
  let currentFilter = '';

  // ---- Utilidades ----
  const norm = (s='') => String(s || '').toLowerCase();

  function mapStatus(s='') {
    const t = norm(s);
    if (t === 'doing' || t === 'en progreso' || t === 'en_progreso') return 'doing';
    if (t === 'done'  || t === 'completada' || t === 'completo')     return 'done';
    return 'todo'; // pendiente o desconocido
  }

  function clearLists() {
    todoList.innerHTML = '';
    doingList.innerHTML = '';
    doneList.innerHTML = '';
  }

  function syncCounts() {
    const nTodo  = todoList.children.length;
    const nDoing = doingList.children.length;
    const nDone  = doneList.children.length;

    todoCount.textContent  = nTodo;
    doingCount.textContent = nDoing;
    doneCount.textContent  = nDone;

    emptyTodo.hidden  = nTodo  > 0;
    emptyDoing.hidden = nDoing > 0;
    emptyDone.hidden  = nDone  > 0;
  }

  function makeItem(task) {
    const id = task._id || task.id || '';
    const title = task.title ?? task.name ?? task.detail ?? '(Sin título)';
    const stKey = mapStatus(task.status);

    // Preferimos el template para respetar tus estilos "chip"
    if (tpl && tpl.content && tpl.content.firstElementChild) {
      const li = tpl.content.firstElementChild.cloneNode(true);
      li.dataset.id = id;
      li.classList.remove('is-todo','is-doing','is-done');
      li.classList.add('is-' + stKey);
      li.querySelector('.kairo-chip__text').textContent = title;
      return { li, stKey };
    }

    // Fallback (por si falta el template)
    const li = document.createElement('li');
    li.dataset.id = id;
    li.className = `kairo-note is-${stKey}`;
    li.innerHTML = `
      <button class="kairo-chip" data-action="edit" aria-label="Editar nota">
        <span class="kairo-chip__text">${title}</span>
      </button>
      <button class="kairo-chip__action" data-action="delete" aria-label="Eliminar nota">
        <span class="icon icon--trash" aria-hidden="true"></span>
      </button>`;
    return { li, stKey };
  }

  function renderBoard(tasks = []) {
    clearLists();
    tasks.forEach(task => {
      const { li, stKey } = makeItem(task);
      if (stKey === 'doing')      doingList.appendChild(li);
      else if (stKey === 'done')  doneList.appendChild(li);
      else                        todoList.appendChild(li);
    });
    syncCounts();
  }

  function renderFiltered() {
    const f = norm(currentFilter);
    const filtered = !f
      ? allTasks
      : allTasks.filter(t => norm(t.title || t.name || t.detail).includes(f));
    renderBoard(filtered);
  }

  async function loadTasks() {
    try {
      const res = await getTasks();
      // Soportar diferentes formas de respuesta
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
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error al eliminar');
    }
  }

  // ---- Eventos UI ----
  // Logout
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    showToast('Sesión cerrada 👋');
    location.hash = '#/login';
  });

  // Menú perfil
  profileBtn.addEventListener('click', () => {
    const expanded = profileBtn.getAttribute('aria-expanded') === 'true';
    profileBtn.setAttribute('aria-expanded', String(!expanded));
    profileMenu.hidden = expanded;
  });

  // Buscar
  searchForm.addEventListener('submit', (e) => e.preventDefault());
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      currentFilter = norm(searchInput.value.trim());
      renderFiltered();
    });
  }
  // Búsqueda en vivo (opcional)
  searchInput.addEventListener('input', () => {
    currentFilter = norm(searchInput.value.trim());
    renderFiltered();
  });

  // Crear
  createBtn.addEventListener('click', () => {
    location.hash = '#/tasks/new';
  });

  // Calendario
  calendarBtn.addEventListener('click', () => {
    showToast('Aquí abrirías el calendario 📅');
    // location.hash = '#/calendar'; // si luego tienes ruta
  });

  // Delegación de eventos en el grid (editar / eliminar)
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const li = btn.closest('.kairo-note');
    const id = li?.dataset.id;
    if (!id) return;

    if (btn.dataset.action === 'edit') {
      // Ruta de edición (igual que tu versión original)
      location.hash = `#/task/edit/${id}`;
      return;
    }

    if (btn.dataset.action === 'delete') {
      if (!confirm('¿Eliminar esta nota?')) return;
      await removeTask(id);
    }
  });

  // ---- Init ----
  loadTasks();
}
