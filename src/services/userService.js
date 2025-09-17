import { http } from '../api/http.js';

/**
 * Register a new user in the system.
 *
 * Sends a POST request to the backend API (`/api/v1/users`)
 * with the provided username and password.
 *
 * @async
 * @function registerUser
 * @param {Object} params - User registration data.
 * @param {string} params.username - The username of the new user.
 * @param {string} params.password - The password of the new user.
 * @returns {Promise<Object>} The created user object returned by the API.
 * @throws {Error} If the API responds with an error status or message.
 *
 * @example
 * try {
 *   const user = await registerUser({ username: "alice", password: "secret" });
 *   console.log("User created:", user);
 * } catch (err) {
 *   console.error("Registration failed:", err.message);
 * }
 */
export async function registerUser({ username, lastname, age, email, password }) {
  const payload = { username, email, password };
  if (lastname && lastname.trim()) payload.lastname = lastname.trim();
  if (age !== undefined && age !== null && String(age).trim() !== '') payload.age = Number(age);
  return http.post('/api/v1/users', payload);
}

export async function loginUser({ email, password }) {
  return http.post('/api/v1/auth/login', { email, password });
}
