import { createTask } from '../services/taskService.js';
import { showToast, setFieldError } from '../api/utils/helpers.js';

export function initTaskNew() {
  const form = document.getElementById('taskForm');
  const msg = document.getElementById('formLiveRegion');
  if (!form) return;

  const saveBtn = document.getElementById('taskSaveBtn');
  const titleInput = document.getElementById('taskTitle');
  titleInput.addEventListener('input', () => {
    saveBtn.disabled = !titleInput.value.trim();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const detail = document.getElementById('taskDetail').value.trim();
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;
    const status = document.getElementById('taskStatus').value;

    // Validación
    let valid = true;
    if (!title) { setFieldError(titleInput, document.getElementById('errTitle'), 'El título es obligatorio'); valid = false; }
    if (!date) { setFieldError(document.getElementById('taskDate'), document.getElementById('errDate'), 'La fecha es obligatoria'); valid = false; }
    if (!time) { setFieldError(document.getElementById('taskTime'), document.getElementById('errTime'), 'La hora es obligatoria'); valid = false; }
    if (!status) { setFieldError(document.getElementById('taskStatus'), document.getElementById('errStatus'), 'Selecciona un estado'); valid = false; }

    if (!valid) return;

    try {
      document.getElementById('taskSaving').hidden = false;
      const resp = await createTask({ title, detail, date, time, status });
      document.getElementById('taskSaving').hidden = true;

      // Notificar a quien escuche (board) para actualizar sin recarga
      const task = resp?.task || resp?.data || { title, detail, date, time, status, _id: resp?.id || undefined, id: resp?.id || undefined };
      window.dispatchEvent(new CustomEvent('tasks:changed', { detail: { type: 'upsert', task } }));

      showToast('Tarea creada correctamente');
      setTimeout(() => (location.hash = '#/board'), 300);
    } catch (err) {
      document.getElementById('taskSaving').hidden = true;

      if (err.status === 401) {
        showToast('Debes iniciar sesión para crear tareas');
        return;
      }

      if (msg) {
        msg.textContent = 'Error al crear tarea: ' + (err.message || 'desconocido');
        msg.hidden = false;
      } else {
        showToast('Error al crear tarea');
      }
      console.error(err);
    }
  });
}
