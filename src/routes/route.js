import { loginUser, registerUser } from '../services/userService.js';
import { createTask, getTasks } from '../services/taskService.js';

const app = document.getElementById('app');

/** Build a safe URL for fetching view fragments */
const viewURL = (name) => new URL(`../views/${name}.html`, import.meta.url);

/** Load an HTML fragment and init its logic */
async function loadView(name) {
  const res = await fetch(viewURL(name));
  if (!res.ok) throw new Error(`Failed to load view: ${name}`);
  const html = await res.text();
  app.innerHTML = html;

  if (name === 'home' || name === 'register') initHome();
  if (name === 'board') initBoard();

  if (name === 'login'   && typeof initLogin   === 'function') initLogin();
  if (name === 'forgot'  && typeof initForgot  === 'function') initForgot?.();
  if (name === 'register'&& typeof initRegister=== 'function') initRegister();
  if (name === 'update'  && typeof initUpdate  === 'function') initUpdate?.();
  if (name === 'task-new'&& typeof initTaskNew === 'function') initTaskNew();
}

/** Router */
export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const path  = (location.hash.startsWith('#/') ? location.hash.slice(2) : '') || 'login';
  const known = ['home', 'board', 'login', 'register', 'forgot', 'update', 'tasks/new'];
  const route = known.includes(path) ? path : 'login';

  const viewName = route === 'home' ? 'register' :
                   route === 'tasks/new' ? 'task-new' : route;

  const token = localStorage.getItem('token');
  if ((route === 'board' || route === 'tasks/new') && !token) return loadView('login');
  if ((route === 'login' || route === 'register') && token)   return loadView('board');

  loadView(viewName).catch(err => {
    console.error(err);
    app.innerHTML = `<p style="color:#ffb4b4">Error loading the view.</p>`;
  });
}

/* ---- View-specific logic ---- */
function initHome() {
  console.log('Home view loaded');
}

function initRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  // Inputs
  const userInput  = document.getElementById('rname');       // username
  const lastInput  = document.getElementById('rlastname');   // lastname
  const birthInput = document.getElementById('rbirthdate');  // birthdate (input type="date")
  const emailInput = document.getElementById('remail');      // email
  const passInput  = document.getElementById('rpassword');   // password
  const pass2Input = document.getElementById('rpassword2');  // confirm password
  const msg        = document.getElementById('regMsg');
  const spinner    = document.getElementById('regSpinner');

  // límites de fecha (permite todo el año de "hoy-13")
  if (birthInput) {
    const yearLimit = new Date().getUTCFullYear() - 13;
    birthInput.max = `${yearLimit}-12-31`;
    birthInput.min = '1900-01-01';
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  const showMsg = (text) => {
    if (!msg) return;
    msg.hidden = !text;
    msg.textContent = text || '';
  };

  // fuerza mínima de contraseña
  const passStrong = (pwd) => (
    /[A-Z]/.test(pwd) &&
    /[a-z]/.test(pwd) &&
    /\d/.test(pwd) &&
    pwd.length >= 8
  );

  const validate = () => {
    let ok = true;

    // requeridos
    if (!userInput.value.trim() || !lastInput.value.trim() ||
        !birthInput.value || !emailInput.value.trim() ||
        !passInput.value || (pass2Input && !pass2Input.value)) {
      ok = false;
    }

    // edad ≥ 13 (laxa por año, leyendo año real del input)
    if (birthInput.value && !isAtLeastYearsOldLoose(birthInput.value, 13, birthInput)) {
      ok = false;
      showMsg('Debes tener al menos 13 años.');
    }

    // fuerza de contraseña
    if (passInput.value && !passStrong(passInput.value)) {
      ok = false;
      showMsg('La contraseña debe tener 8+ caracteres, con mayúscula, minúscula y número.');
    }

    // confirmar contraseña
    if (passInput.value && pass2Input && pass2Input.value && passInput.value !== pass2Input.value) {
      ok = false;
      showMsg('Las contraseñas no coinciden.');
    }

    if (ok) showMsg('');
    if (submitBtn) submitBtn.disabled = !ok;
    return ok;
  };

  [userInput, lastInput, birthInput, emailInput, passInput, pass2Input]
    .forEach(el => el && el.addEventListener('input', validate));
  validate();

  // Spinner: mínimo visible y máximo de seguridad
  const SPINNER_MIN_MS = 800;   // como mínimo 0.8s visible
  const SPINNER_MAX_MS = 5000;  // nunca más de 5s

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (msg) { msg.hidden = true; msg.textContent = ''; }

    const username  = userInput?.value.trim();
    const lastname  = lastInput?.value.trim();
    const birthdate = birthInput?.value;      // el input envía ISO aunque muestre DD/MM/YYYY
    const email     = emailInput?.value.trim();
    const password  = passInput?.value;

    if (!username || !lastname || !birthdate || !email || !password) {
      if (msg) { msg.hidden = false; msg.textContent = 'Completa todos los campos.'; }
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    if (spinner) spinner.hidden = false;
    const start = performance.now();
    const guard = setTimeout(() => { if (spinner) spinner.hidden = true; }, SPINNER_MAX_MS);

    try {
      await registerUser({ username, lastname, birthdate, email, password });

      // asegura visibilidad mínima del spinner
      const elapsed = performance.now() - start;
      const rest = Math.max(0, SPINNER_MIN_MS - elapsed);
      if (rest) await new Promise(r => setTimeout(r, rest));

      if (msg) { msg.hidden = false; msg.textContent = 'Registro exitoso'; }
      setTimeout(() => (location.hash = '#/login'), 400);
    } catch (err) {
      const elapsed = performance.now() - start;
      const rest = Math.max(0, SPINNER_MIN_MS - elapsed);
      if (rest) await new Promise(r => setTimeout(r, rest));

      if (msg) { msg.hidden = false; msg.textContent = `No se pudo registrar: ${err.message}`; }
    } finally {
      clearTimeout(guard);
      if (spinner) spinner.hidden = true;
      if (btn) btn.disabled = false;
    }
  });
}

/* Helpers de fecha */
function parseISODateUTC(yyyyMmDd) {
  const [y, m, d] = (yyyyMmDd || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

// ≥ N años (laxa por año, robusta con valueAsDate y DD/MM/YYYY)
function isAtLeastYearsOldLoose(birthStr, years = 13, inputEl) {
  let birthYear;

  // 1) Preferir valueAsDate del input type="date"
  if (inputEl && inputEl.valueAsDate instanceof Date) {
    birthYear = inputEl.valueAsDate.getUTCFullYear();
  } else {
    // 2) ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthStr)) {
      birthYear = Number(birthStr.slice(0, 4));
    } else {
      // 3) Intento DD/MM/YYYY o variantes
      const parts = (birthStr || '').split(/[\/\-.]/).map(s => s.trim());
      const y = parts.find(p => /^\d{4}$/.test(p));
      birthYear = y ? Number(y) : NaN;
    }
  }

  if (!birthYear) return false;
  const currentYear = new Date().getUTCFullYear();
  return birthYear <= (currentYear - years);
}

// (Precisa al día) No la usamos ahora, pero se deja disponible
function isAtLeastYearsOld(birthStr, years = 13) {
  const birth = parseISODateUTC(birthStr);
  if (!birth) return false;

  const now = new Date();
  const cutoff = new Date(Date.UTC(
    now.getUTCFullYear() - years,
    now.getUTCMonth(),
    now.getUTCDate()
  ));
  return birth <= cutoff;
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

    const email    = emailInput?.value.trim();
    const password = passInput?.value.trim();

    if (!email || !password) {
      if (msg) msg.textContent = 'Ingresa tu correo y contraseña.';
      return;
    }

    try {
      const data = await loginUser({ email, password });
      localStorage.setItem('token', data.token);
      location.hash = '#/board';
    } catch (err) {
      if (msg) msg.textContent = `Error al iniciar sesión: ${err.message}`;
    }
  });
}

function initTaskNew() {
  const form    = document.getElementById('taskForm');
  const saveBtn = document.getElementById('taskSaveBtn');
  const saving  = document.getElementById('taskSaving');
  const live    = document.getElementById('formLiveRegion');

  const titleEl  = document.getElementById('taskTitle');
  const detailEl = document.getElementById('taskDetail');
  const dateEl   = document.getElementById('taskDate');
  const timeEl   = document.getElementById('taskTime');
  const statusEl = document.getElementById('taskStatus');

  const errTitle  = document.getElementById('errTitle');
  const errDetail = document.getElementById('errDetail');
  const errDate   = document.getElementById('errDate');
  const errTime   = document.getElementById('errTime');
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

/** Board */
function initBoard() {
  const formLegacy  = document.getElementById('todoForm');
  const inputLegacy = document.getElementById('newTodo');
  const list        = document.getElementById('todoList') || document.getElementById('notesList');
  if (!list) return;

  const emptyState = document.getElementById('emptyState');

  async function loadTasks() {
    try {
      const tasks = await getTasks();
      list.innerHTML = '';

      if (!Array.isArray(tasks) || tasks.length === 0) {
        list.hidden = true;
        if (emptyState) emptyState.hidden = false;
        return;
      }

      list.hidden = false;
      if (emptyState) emptyState.hidden = true;

      const isListTag = list.tagName === 'UL' || list.tagName === 'OL';

      for (const t of tasks) {
        const el = document.createElement(isListTag ? 'li' : 'div');
        el.className = 'note-item';
        el.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:.5rem;align-items:baseline">
          <strong>${t.title ?? ''}</strong>
          <small>${t.date ?? ''} ${t.time ?? ''}</small>
        </div>
        ${t.detail ? `<div style="opacity:.85">${t.detail}</div>` : ''}
        <span class="badge" style="display:inline-block;margin-top:.25rem;opacity:.8">${t.status ?? ''}</span>
      `;
        list.appendChild(el);
      }
    } catch (e) {
      if (import.meta.env?.DEV) console.error('No se pudieron cargar las tareas:', e);
      list.hidden = true;
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.textContent = 'Error al obtener tareas';
        emptyState.style.color = '#f55';
      }
    }
  }

  loadTasks();

  const createBtn = document.getElementById('createBtn');
  if (createBtn) {
    createBtn.addEventListener('click', () => { location.hash = '#/tasks/new'; });
  }

  const profileBtn  = document.getElementById('profileBtn');
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

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      location.hash = '#/login';
    });
  }

  const searchForm  = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const searchBtn   = document.getElementById('searchBtn');

  if (searchForm && searchInput && searchBtn) {
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
