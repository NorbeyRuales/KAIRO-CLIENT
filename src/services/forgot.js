// src/services/forgot.js

const API_BASE =
    (import.meta?.env && import.meta.env.VITE_API_BASE) ||
    'http://localhost:8080/api/v1';

// Prefijo del grupo de rutas en tu backend.
// Si en tu servidor es /api/v1/users/forgot-password, cambia a 'users'.
const AUTH_PREFIX = 'users';

export async function requestPasswordReset(email) {
    const res = await fetch(`${API_BASE}/${AUTH_PREFIX}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });

    // intenta leer respuesta como JSON siempre
    let data = {};
    try { data = await res.json(); } catch (_) { }

    if (!res.ok) {
        throw new Error(data.message || 'No se pudo enviar el enlace.');
    }
    return data; // { message: '...' }
}
