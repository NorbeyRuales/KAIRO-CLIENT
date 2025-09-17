import { loginUser, registerUser } from '../services/userService.js';
import { createTask } from '../services/taskService.js';


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
  if (name === 'update' && typeof initUpdate === 'function') initUpdate();
  if (name === 'task-new' && typeof initTaskNew === 'function') initTaskNew();




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
  const known = ['home', 'board', 'login', 'register', 'forgot', 'update', 'tasks/new'];
  const route = known.includes(path) ? path : 'login';

  const viewName = route === 'home' ? 'register' :
    route === 'tasks/new' ? 'task-new' :
      route;

  const token = localStorage.getItem('token');
  if ((route === 'board' || route === 'tasks/new') && !token) return loadView('login');
  if ((route === 'login' || route === 'register') && token) return loadView('board');

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
  const userInput = document.getElementById('username') || document.getElementById('rname');
  const emailInput = document.getElementById('email') || document.getElementById('remail');
  const passInput = document.getElementById('password') || document.getElementById('rpassword');
  const msg = document.getElementById('registerMsg') || document.getElementById('regMsg');
  const lastInput = document.getElementById('rlastname');
  const ageInput = document.getElementById('rage');


  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = '';

    const username = userInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passInput?.value.trim();
    const lastname = lastInput?.value.trim() || '';
    const age = ageInput?.value ? Number(ageInput.value) : null;

    if (!username || !email || !password) {
      if (msg) msg.textContent = 'Completa nombre, correo y contraseña.';
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    try {
      await registerUser({ username, lastname, age, email, password });
      if (msg) msg.textContent = 'Registro exitoso';
      setTimeout(() => (location.hash = '#/board'), 600);
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
  const passInput = document.getElementById('lpassword');
  const msg = document.getElementById('loginMsg');

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

function initTaskNew() {
  const form = document.getElementById('taskForm');
  const saveBtn = document.getElementById('taskSaveBtn');
  const saving = document.getElementById('taskSaving');
  const live = document.getElementById('formLiveRegion');

  const titleEl = document.getElementById('taskTitle');
  const detailEl = document.getElementById('taskDetail');
  const dateEl = document.getElementById('taskDate');
  const timeEl = document.getElementById('taskTime');
  const statusEl = document.getElementById('taskStatus');

  const errTitle = document.getElementById('errTitle');
  const errDetail = document.getElementById('errDetail');
  const errDate = document.getElementById('errDate');
  const errTime = document.getElementById('errTime');
  const errStatus = document.getElementById('errStatus');

  const setErr = (el, msg) => { if (el) el.textContent = msg || ''; };

  const validate = () => {
    let ok = true;

    const t = (titleEl.value || '').trim();
    if (!t) { setErr(errTitle, 'Completa este campo'); ok = false; }
    else if (t.length > 50) { setErr(errTitle, 'Máx. 50 caracteres'); ok = false; }
    else setErr(errTitle, '');

    const d = (detailEl.value || '');
    if (d.length > 500) { setErr(errDetail, 'Máx. 500 caracteres'); ok = false; }
    else setErr(errDetail, '');

    if (!dateEl.value) { setErr(errDate, 'Completa este campo'); ok = false; } else setErr(errDate, '');
    if (!timeEl.value) { setErr(errTime, 'Completa este campo'); ok = false; } else setErr(errTime, '');
    if (!statusEl.value) { setErr(errStatus, 'Completa este campo'); ok = false; } else setErr(errStatus, '');

    saveBtn.disabled = !ok;
    return ok;
  };

  [titleEl, detailEl, dateEl, timeEl, statusEl].forEach(el => {
    el.addEventListener('input', validate);
    el.addEventListener('change', validate);
  });
  validate();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) {
      if (live) { live.hidden = false; live.textContent = 'Revisa los campos marcados.'; }
      return;
    }

    saveBtn.disabled = true;
    saving.hidden = false;
    if (live) { live.hidden = true; live.textContent = ''; }
    const autoHide = setTimeout(() => { saving.hidden = true; }, 2000);

    try {
      await createTask({
        title: titleEl.value.trim(),
        detail: (detailEl.value || '').trim(),
        date: dateEl.value,
        time: timeEl.value,
        status: statusEl.value
      });
      clearTimeout(autoHide);
      saving.hidden = true;
      location.hash = '#/board';
    } catch (err) {
      clearTimeout(autoHide);
      saving.hidden = true;
      saveBtn.disabled = false;
      if (live) { live.hidden = false; live.textContent = 'No pudimos guardar tu tarea, inténtalo de nuevo'; }
      if (import.meta.env && import.meta.env.DEV) console.error(err);
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


  const createBtn = document.getElementById('createBtn');
  if (createBtn) {
    createBtn.addEventListener('click', () => { location.hash = '#/tasks/new'; });
  }

  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');
  if (profileBtn && profileMenu) {
    const closeMenu = () => {
      profileMenu.hidden = true;
      profileBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
    const onDocClick = (ev) => {
      if (ev.target === profileBtn || profileBtn.contains(ev.target)) return;
      if (ev.target === profileMenu || profileMenu.contains(ev.target)) return;
      closeMenu();
    };
    const onEsc = (ev) => { if (ev.key === 'Escape') closeMenu(); };
    profileBtn.addEventListener('click', () => {
      const open = profileMenu.hidden === false;
      if (open) closeMenu();
      else {
        profileMenu.hidden = false;
        profileBtn.setAttribute('aria-expanded', 'true');
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onEsc);
      }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      location.hash = '#/login';
    });
  }

  // Buscador plegable + filtro
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  if (searchForm && searchInput && searchBtn) {
    // empieza plegado
    searchForm.classList.add('is-compact');

    const compactIfEmpty = () => {
      if (!searchInput.value.trim()) {
        searchForm.classList.add('is-compact');
      }
    };

    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const compact = searchForm.classList.contains('is-compact');
      if (compact) {
        searchForm.classList.remove('is-compact');
        searchInput.focus();
      } else if (!searchInput.value.trim()) {
        searchForm.classList.add('is-compact');
      }
    });

    searchInput.addEventListener('blur', compactIfEmpty);
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      Array.from(list.children).forEach(li => {
        const text = li.textContent.toLowerCase();
        li.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }



}
