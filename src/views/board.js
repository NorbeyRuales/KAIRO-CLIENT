import { getTasks, deleteTask } from '../services/taskService.js';
import { showToast } from '../api/utils/helpers.js';

export function initBoard() {
  const logoutBtn = document.getElementById('logoutBtn');
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');
  const notesList = document.getElementById('notesList');
  const emptyState = document.getElementById('emptyState');
  const createBtn = document.getElementById('createBtn');
  const calendarBtn = document.getElementById('calendarBtn');

  if (!logoutBtn || !notesList) return;

  // ---------- Logout ----------
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    showToast('Sesión cerrada 👋');
    location.hash = '#/login';
  });

  // ---------- Menú perfil ----------
  profileBtn.addEventListener('click', () => {
    const expanded = profileBtn.getAttribute('aria-expanded') === 'true';
    profileBtn.setAttribute('aria-expanded', !expanded);
    profileMenu.hidden = expanded;
  });

  // ---------- Buscar ----------
  searchForm.addEventListener('submit', (e) => e.preventDefault());
  document.getElementById('searchBtn').addEventListener('click', () => {
    renderNotes(searchInput.value.trim());
  });

  // ---------- Crear ----------
  createBtn.addEventListener('click', () => {
    location.hash = '#/tasks/new';
  });

  // ---------- Calendario ----------
  calendarBtn.addEventListener('click', () => {
    showToast('Aquí abrirías el calendario 📅');
    // TODO: puedes redirigir a un #/calendar
  });

  // ---------- Renderizar notas ----------
  async function renderNotes(filter = '') {
    notesList.innerHTML = '';
    try {
      const tasks = await getTasks();
      const filtered = tasks.filter(t =>
        t.title.toLowerCase().includes(filter.toLowerCase())
      );

      if (filtered.length === 0) {
        emptyState.hidden = false;
        notesList.hidden = true;
        return;
      }

      emptyState.hidden = true;
      notesList.hidden = false;

      filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = 'kairo-item';
        li.innerHTML = `
          <button class="note-btn" aria-label="Editar nota">${task.title}</button>
          <button class="del-btn" aria-label="Eliminar nota">🗑</button>
        `;

        // Editar → redirigir a la vista de edición
        li.querySelector('.note-btn').addEventListener('click', () => {
          console.log("Task enviado a editar:", task._id);
          location.hash = `#/task/edit/${task._id}`;
        });

        // Eliminar
        li.querySelector('.del-btn').addEventListener('click', async () => {
          if (!confirm('¿Eliminar esta nota?')) return;
          try {
            await deleteTask(task._id);
            showToast('Nota eliminada 🗑️');
            renderNotes(filter);
          } catch (err) {
            showToast(err.message || 'Error al eliminar');
          }
        });

        notesList.appendChild(li);
      });
    } catch (err) {
      showToast(err.message || 'Error al cargar notas');
    }
  }

  // Inicializar lista
  renderNotes();
}
