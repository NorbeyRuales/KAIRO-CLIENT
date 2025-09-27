import { getTaskById, updateTask } from '../services/taskService.js';
import { showToast, setFieldError } from '../api/utils/helpers.js';

export async function initTaskEdit(taskId) {
  const form = document.getElementById('taskForm');
  const msg  = document.getElementById('editFormLiveRegion');
  if (!form) return;

  try {
    const task = await getTaskById(taskId);
    document.getElementById('taskTitle').value  = task.title  || '';
    document.getElementById('taskDetail').value = task.detail || '';
    document.getElementById('taskDate').value   = task.date   || '';
    document.getElementById('taskTime').value   = task.time   || '';
    document.getElementById('taskStatus').value = task.status || '';
  } catch (err) {
    showToast('Error al cargar la tarea');
    console.error(err);
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titleEl  = document.getElementById('taskTitle');
    const detailEl = document.getElementById('taskDetail');
    const dateEl   = document.getElementById('taskDate');
    const timeEl   = document.getElementById('taskTime');
    const statusEl = document.getElementById('taskStatus');

    const title  = titleEl.value.trim();
    const detail = detailEl.value.trim();
    const date   = dateEl.value;
    const time   = timeEl.value;
    const status = statusEl.value;

    let valid = true;
    if (!title)  { setFieldError(titleEl,  document.getElementById('errTitle'),  'El título es obligatorio'); valid = false; }
    if (!date)   { setFieldError(dateEl,   document.getElementById('errDate'),   'La fecha es obligatoria');   valid = false; }
    if (!time)   { setFieldError(timeEl,   document.getElementById('errTime'),   'La hora es obligatoria');    valid = false; }
    if (!status) { setFieldError(statusEl, document.getElementById('errStatus'), 'Selecciona un estado');      valid = false; }

    if (!valid) return;

    try {
      document.getElementById('taskSaving').hidden = false;
      const resp = await updateTask(taskId, { title, detail, date, time, status });
      document.getElementById('taskSaving').hidden = true;

      const task = resp?.task || resp?.data || { _id: taskId, id: taskId, title, detail, date, time, status };
      window.dispatchEvent(new CustomEvent('tasks:changed', {
        detail: { type: 'upsert', task }
      }));

      showToast('Tarea actualizada correctamente');
      setTimeout(() => (location.hash = '#/board'), 300);
    } catch (err) {
      document.getElementById('taskSaving').hidden = true;
      if (msg) {
        msg.textContent = 'Error al actualizar: ' + (err.message || 'desconocido');
        msg.hidden = false;
      } else {
        showToast('Error al actualizar tarea');
      }
      console.error(err);
    }
  });
}
