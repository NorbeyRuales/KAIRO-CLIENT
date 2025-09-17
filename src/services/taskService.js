import { http } from '../api/http.js';

// Crea una tarea en el backend.
// Combina fecha+hora a ISO para enviarla como dueAt.
export async function createTask({ title, detail, date, time, status }) {
    const dueAt = (date && time) ? new Date(`${date}T${time}:00`).toISOString() : null;

    // Ajusta el endpoint si tu API usa otro path/campos
    return http.post('/api/v1/tasks', {
        title,
        detail,
        status,
        dueAt
    });
}