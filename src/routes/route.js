import { loginUser, registerUser } from '../services/userService.js';

const app = document.getElementById('app');

/**
 * Build a safe URL for fetching view fragments inside Vite (dev and build).
 * @param {string} name - The name of the view (without extension).
 * @returns {URL} The resolved URL for the view HTML file.
 */
const viewURL = (name) => new URL(`../views/${name}.html`, import.meta.url);

/**
 * Load an HTML fragment by view name and initialize its corresponding logic.
 * @async
 * @param {string} name - The view name to load (e.g., "home", "board", "login", "register", "forgot").
 * @throws {Error} If the view cannot be fetched.
 */
async function loadView(name) {
  const res = await fetch(viewURL(name));
  if (!res.ok) throw new Error(`Failed to load view: ${name}`);
  const html = await res.text();
  app.innerHTML = html;
  //inicializa las funciones de cada vista
  if (name === 'home' || name === 'register') initHome();
  if (name === 'board') initBoard();

  if (name === 'login' && typeof initLogin === 'function') initLogin();
  if (name === 'forgot' && typeof initForgot === 'function') initForgot();
  if (name === 'register' && typeof initRegister === 'function') initRegister();




}

/**
 * Initialize the hash-based router.
 * Attaches an event listener for URL changes and triggers the first render.
 */
export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute(); // first render
}

/**
 * Handle the current route based on the location hash.
 * Fallback to 'home' if the route is unknown.
 */
function handleRoute() {
  const path = (location.hash.startsWith('#/') ? location.hash.slice(2) : '') || 'login';
  const known = ['home', 'board', 'login', 'register', 'forgot'];
  const route = known.includes(path) ? path : 'login';

  const viewName = route === 'home' ? 'register' : route;

  // Validar sesión antes de entrar al board
  const token = localStorage.getItem('token');
  if (route === 'board' && !token) {
    return loadView('login');
  }

  // Si ya tengo token y estoy en login/registro → mandar al board
  if ((route === 'login' || route === 'register') && token) {
    return loadView('board');
  }

  loadView(viewName).catch(err => {
    console.error(err);
    app.innerHTML = `<p style="color:#ffb4b4">Error loading the view.</p>`;
  });
}

/* ---- View-specific logic ---- */

/**
 * Initialize the "home" view.
 * Attaches a submit handler to the register form to navigate to the board.
 */

function initHome() {
  console.log('Home view loaded');
}

function initRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  // Support both legacy IDs and Kairo IDs
  const userInput  = document.getElementById('username')  || document.getElementById('rname');
  const emailInput = document.getElementById('email')     || document.getElementById('remail');
  const passInput  = document.getElementById('password')  || document.getElementById('rpassword');
  const msg        = document.getElementById('registerMsg') || document.getElementById('regMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = '';

    const username = userInput?.value.trim();
    const email    = emailInput?.value.trim();
    const password = passInput?.value.trim();

    if (!username || !email || !password) {
      if (msg) msg.textContent = 'Completa nombre, correo y contraseña.';
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    try {
      await registerUser({ username, email, password });
      if (msg) msg.textContent = 'Registro exitoso';
      setTimeout(() => (location.hash = '#/board'), 400);
    } catch (err) {
      if (msg) msg.textContent = `No se pudo registrar: ${err.message}`;
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput = document.getElementById('lemail');
  const passInput  = document.getElementById('lpassword');
  const msg        = document.getElementById('loginMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = '';

    const email = emailInput?.value.trim();
    const password = passInput?.value.trim();

    if (!email || !password) {
      if (msg) msg.textContent = 'Ingresa tu correo y contraseña.';
      return;
    }

    try {
      const data = await loginUser({ email, password });

      // Guardar token en localStorage
      localStorage.setItem('token', data.token);

      // Redirigir al tablero
      location.hash = '#/board';
    } catch (err) {
      if (msg) msg.textContent = `Error al iniciar sesión: ${err.message}`;
    }
  });
}
/**
 * Initialize the "board" view.
 * Sets up the todo form, input, and list with create/remove/toggle logic.
 */
function initBoard() {
  // Try legacy IDs first
  const formLegacy = document.getElementById('todoForm');
  const inputLegacy = document.getElementById('newTodo');
  const list = document.getElementById('todoList') || document.getElementById('notesList');
  if (!list) return;

  // Creator (legacy: form submit) OR Kairo: + button
  const createBtn = document.getElementById('createBtn');

  function addItem(title) {
    if (!title) return;
    const li = document.createElement('li');
    li.className = 'todo';
    li.innerHTML = `
      <label>
        <input type="checkbox" class="check">
        <span>${title}</span>
      </label>
      <button class="link remove" type="button">Eliminar</button>
    `;
    // show list if it was hidden by empty state
    const empty = document.getElementById('emptyState');
    if (empty) empty.hidden = true;
    list.hidden = false;
    list.prepend(li);
  }

  if (formLegacy && inputLegacy) {
    formLegacy.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = inputLegacy.value.trim();
      if (!title) return;
      addItem(title);
      inputLegacy.value = '';
    });
  }

  if (createBtn && !formLegacy) {
    createBtn.addEventListener('click', () => {
      const title = prompt('Título de la nota/tarea:');
      if (title) addItem(title.trim());
    });
  }

  // Remove / toggle
  list.addEventListener('click', (e) => {
    const li = e.target.closest('.todo');
    if (!li) return;
    if (e.target.matches('.remove')) li.remove();
    if (e.target.matches('.check')) li.classList.toggle('completed', e.target.checked);
    // show empty state if no items
    if (!list.children.length) {
      const empty = document.getElementById('emptyState');
      if (empty) empty.hidden = false;
      list.hidden = true;
    }
  });

  // Logout button
  const logoutBtn = document.getElementById('profileBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      location.hash = '#/login';
    });
  }


  // Optional: search support for Kairo search form
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => e.preventDefault());
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      Array.from(list.children).forEach((li) => {
        const text = li.textContent.toLowerCase();
        li.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }
}
