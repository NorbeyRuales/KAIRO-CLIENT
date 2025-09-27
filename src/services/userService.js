// src/services/userService.js
import { http } from "../api/http.js";

/**
 * Register a new user
 */
export async function registerUser(userData) {
  try {
    return await http.post("/users", userData);
  } catch (e) {
    throw e;
  }
}

/**
 * Login user with email + password
 */
export async function loginUser(credentials) {
  const res = await http.post("/auth/login", credentials);

  // Si el backend devuelve { token, user }, lo guardamos
  if (res?.token) {
    localStorage.setItem("token", res.token);
  }

  return res;
}

/**
 * Get current logged-in user profile
 */
export async function getProfile() {
  return await http.get("/users/profile");
}

/**
 * Update current logged-in user profile
 */
export async function updateProfile(data) {
  return await http.put("/users/profile", data);
}