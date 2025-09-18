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



export async function registerUser({ username, lastname, birthdate, email, password }) {
  const payload = {
    username: username?.trim(),
    lastname: lastname?.trim(),
    birthdate,            // YYYY-MM-DD (del <input type="date">)
    email: email?.trim(),
    password
  };
  return http.post('/api/v1/users', payload);
}

export  function loginUser({ email, password }) {
  return http.post('/auth/login', { email, password }); 
}
