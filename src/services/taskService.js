import { http } from '../api/http.js';

/** Obtener todas las tareas del usuario autenticado. */
export async function getTasks() {
  return http.get('/tasks');
}

/** Crear una nueva tarea. */
export async function createTask(task) {
  return http.post('/tasks', task);
}

/** Actualizar una tarea existente. */
export async function updateTask(id, updates) {
  return http.put(`/tasks/${id}`, updates);
}

/** Eliminar una tarea. */
export async function deleteTask(id) {
  return http.del(`/tasks/${id}`);
}

/** Obtener una tarea por ID. */
export async function getTaskById(id) {
  return http.get(`/tasks/${id}`);
}
