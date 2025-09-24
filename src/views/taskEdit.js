import { getTaskById, updateTask } from '../services/taskService.js';
import { showToast, setFieldError } from '../api/utils/helpers.js';

export async function initTaskEdit(taskId) {
  const form = document.getElementById('taskForm');
  const msg = document.getElementById('editFormLiveRegion');
  if (!form) return;

  // Cargar datos de la tarea
  try {
    const task = await getTaskById(taskId);
    document.getElementById('taskTitle').value = task.title || '';
    document.getElementById('taskDetail').value = task.detail || '';
    document.getElementById('taskDate').value = task.date || '';
    document.getElementById('taskTime').value = task.time || '';
    document.getElementById('taskStatus').value = task.status || '';
  } catch (err) {
    showToast('Error al cargar la tarea');
    console.error(err);
    return;
  }

  // Manejar submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const detail = document.getElementById('taskDetail').value.trim();
    const date = document.getElementById('taskDate').value;
    const time = document.getElementById('taskTime').value;
    const status = document.getElementById('taskStatus').value;

    // Validación básica
    let valid = true;
    if (!title) { setFieldError(form.taskTitle, document.getElementById('errTitle'), 'El título es obligatorio'); valid = false; }
    if (!date) { setFieldError(form.taskDate, document.getElementById('errDate'), 'La fecha es obligatoria'); valid = false; }
    if (!time) { setFieldError(form.taskTime, document.getElementById('errTime'), 'La hora es obligatoria'); valid = false; }
    if (!status) { setFieldError(form.taskStatus, document.getElementById('errStatus'), 'Selecciona un estado'); valid = false; }

    if (!valid) return;

    try {
      // Mostrar spinner
      document.getElementById('taskSaving').hidden = false;
      await updateTask(taskId, { title, detail, date, time, status });
      document.getElementById('taskSaving').hidden = true;

      showToast('Tarea actualizada correctamente');
      setTimeout(() => (location.hash = '#/board'), 300);
    } catch (err) {
      document.getElementById('taskSaving').hidden = true;
      if (msg) {
        msg.textContent = 'Error al actualizar: ' + err.message;
        msg.hidden = false;
      } else {
        showToast('Error al actualizar tarea');
      }
      console.error(err);
    }
  });
}
