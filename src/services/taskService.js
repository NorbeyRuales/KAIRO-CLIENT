import { http } from '../api/http.js';

/**
 * Obtener todas las tareas del usuario autenticado.
 * @returns {Promise<Array>} Lista de tareas
 */
export async function getTasks() {
  return http.get('/tasks');
}

/**
 * Crear una nueva tarea.
 * @param {Object} task - Datos de la tarea
 * @param {string} task.title - Título de la tarea
 * @param {string} [task.detail] - Detalles opcionales
 * @param {string} task.date - Fecha (YYYY-MM-DD)
 * @param {string} task.time - Hora (HH:mm)
 * @param {string} task.status - Estado de la tarea
 * @returns {Promise<Object>} Tarea creada
 */
export async function createTask(task) {
  return http.post('/tasks', task);
}

/**
 * Actualizar una tarea existente.
 * @param {string} id - ID de la tarea
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} Tarea actualizada
 */
export async function updateTask(id, updates) {
  return http.put(`/tasks/${id}`, updates);
}

/**
 * Eliminar una tarea.
 * @param {string} id - ID de la tarea
 * @returns {Promise<void>}
 */
export async function deleteTask(id) {
  return http.del(`/tasks/${id}`);
}

/**
 * Obtener una tarea por ID.
 * @param {string} id - ID de la tarea
 * @returns {Promise<Object>} Tarea encontrada
 */
export async function getTaskById(id) {
  return http.get(`/tasks/${id}`);
}