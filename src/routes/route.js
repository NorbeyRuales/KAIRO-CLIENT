import { loginUser, registerUser } from '../services/userService.js';
import { createTask, getTasks } from '../services/taskService.js';
import { requestPasswordReset } from '../services/forgot.js';

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

  if (name === 'login' && typeof initLogin === 'function') initLogin();
  if (name === 'forgot' && typeof initForgot === 'function') initForgot();
  if (name === 'register' && typeof initRegister === 'function') initRegister();
  if (name === 'update' && typeof initUpdate === 'function') initUpdate?.();
  if (name === 'task-new' && typeof initTaskNew === 'function') initTaskNew();
}

/** Router */
export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const path = (location.hash.startsWith('#/') ? location.hash.slice(2) : '') || 'login';
  const known = ['home', 'board', 'login', 'register', 'forgot', 'update', 'tasks/new'];
  const route = known.includes(path) ? path : 'login';

  const viewName = route === 'home' ? 'register' :
    route === 'tasks/new' ? 'task-new' : route;

  const token = localStorage.getItem('token');
  if ((route === 'board' || route === 'tasks/new') && !token) return loadView('login');
  if ((route === 'login' || route === 'register') && token) return loadView('board');

  loadView(viewName).catch(err => {
    console.error(err);
    app.innerHTML = `<p style="color:#ffb4b4">Error loading the view.</p>`;
  });
}

/* ---- View-specific logic ---- */
function initHome() {
  console.log('Home view loaded');
}

/* ===== Utils ===== */
function showToast(text) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    Object.assign(t.style, {
      position: 'fixed', right: '16px', bottom: '16px',
      padding: '10px 14px', background: '#111', color: '#fff',
      borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,.25)', zIndex: 9999
    });
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.hidden = false;
  clearTimeout(t._hid);
  t._hid = setTimeout(() => (t.hidden = true), 2200);
}

function setFieldError(el, msgEl, text = '') {
  if (!msgEl) return;
  msgEl.textContent = text || '';
  msgEl.hidden = !text;
  if (el) el.setAttribute('aria-invalid', text ? 'true' : 'false');
}

function emailLooksValid(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* ====== Register ====== */
function initRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  // Inputs
  const userInput = document.getElementById('rname');        // nombres
  const lastInput = document.getElementById('rlastname');    // apellidos
  const birthInput = document.getElementById('rbirthdate');   // fecha de nacimiento
  const emailInput = document.getElementById('remail');
  const passInput = document.getElementById('rpassword');
  const pass2Input = document.getElementById('rpassword2');
  const msg = document.getElementById('regMsg');
  const spinner = document.getElementById('regSpinner');

  // Contenedores de error (si existen en el HTML)
  const errName = document.getElementById('errName');
  const errLast = document.getElementById('errLast');
  const errBirth = document.getElementById('errBirth');
  const errEmail = document.getElementById('errEmail');
  const errPass = document.getElementById('errPass');
  const errPass2 = document.getElementById('errPass2');

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

  // Password fuerte: mayúscula, minúscula, número y CARÁCTER ESPECIAL
  const passStrong = (pwd) => (
    /[A-Z]/.test(pwd) &&
    /[a-z]/.test(pwd) &&
    /\d/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd) &&
    pwd.length >= 8
  );

  const validate = () => {
    let ok = true;

    // Nombres
    if (!userInput.value.trim()) { ok = false; setFieldError(userInput, errName, 'Completa este campo'); }
    else setFieldError(userInput, errName, '');

    // Apellidos
    if (!lastInput.value.trim()) { ok = false; setFieldError(lastInput, errLast, 'Completa este campo'); }
    else setFieldError(lastInput, errLast, '');

    // Fecha de nacimiento ≥ 13
    if (!birthInput.value || !isAtLeastYearsOldLoose(birthInput.value, 13, birthInput)) {
      ok = false; setFieldError(birthInput, errBirth, 'Debes tener al menos 13 años');
    } else setFieldError(birthInput, errBirth, '');

    // Email
    const em = emailInput.value.trim();
    if (!em) { ok = false; setFieldError(emailInput, errEmail, 'Completa este campo'); }
    else if (!emailLooksValid(em)) { ok = false; setFieldError(emailInput, errEmail, 'Correo no válido'); }
    else setFieldError(emailInput, errEmail, '');

    // Password
    if (!passInput.value) { ok = false; setFieldError(passInput, errPass, 'Completa este campo'); }
    else if (!passStrong(passInput.value)) {
      ok = false;
      setFieldError(passInput, errPass, 'Mín. 8, con mayúscula, minúscula, número y símbolo');
    } else setFieldError(passInput, errPass, '');

    // Confirmación
    if (!pass2Input.value) { ok = false; setFieldError(pass2Input, errPass2, 'Completa este campo'); }
    else if (pass2Input.value !== passInput.value) { ok = false; setFieldError(pass2Input, errPass2, 'No coincide'); }
    else setFieldError(pass2Input, errPass2, '');

    if (ok) showMsg('');
    if (submitBtn) submitBtn.disabled = !ok;
    return ok;
  };

  [userInput, lastInput, birthInput, emailInput, passInput, pass2Input]
    .forEach(el => el && el.addEventListener('input', validate));
  validate();

  // Spinner: mínimo visible y máximo de seguridad
  const SPINNER_MIN_MS = 800;
  const SPINNER_MAX_MS = 3000; // <= 3 s

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (msg) { msg.hidden = true; msg.textContent = ''; }

    const username = userInput?.value.trim();
    const lastname = lastInput?.value.trim();
    const birthdate = birthInput?.value;      // ISO
    const email = emailInput?.value.trim();
    const password = passInput?.value;

    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    if (spinner) spinner.hidden = false;
    const start = performance.now();
    const guard = setTimeout(() => { if (spinner) spinner.hidden = true; }, SPINNER_MAX_MS);

    try {
      await registerUser({ username, lastname, birthdate, email, password });

      const elapsed = performance.now() - start;
      const rest = Math.max(0, SPINNER_MIN_MS - elapsed);
      if (rest) await new Promise(r => setTimeout(r, rest));

      showToast('Cuenta creada con éxito');
      setTimeout(() => (location.hash = '#/login'), 400);
    } catch (err) {
      const elapsed = performance.now() - start;
      const rest = Math.max(0, SPINNER_MIN_MS - elapsed);
      if (rest) await new Promise(r => setTimeout(r, rest));

      const status = err?.status ?? err?.response?.status;
      if (status === 409) {
        showMsg('Este correo ya está registrado');
      } else if (status >= 500) {
        showMsg('Intenta de nuevo más tarde');
        if (import.meta.env?.DEV) console.error(err);
      } else {
        showMsg(`No se pudo registrar: ${err.message}`);
      }
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

  if (inputEl && inputEl.valueAsDate instanceof Date) {
    birthYear = inputEl.valueAsDate.getUTCFullYear();
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(birthStr)) {
    birthYear = Number(birthStr.slice(0, 4));
  } else {
    const parts = (birthStr || '').split(/[\/\-.]/).map(s => s.trim());
    const y = parts.find(p => /^\d{4}$/.test(p));
    birthYear = y ? Number(y) : NaN;
  }

  if (!birthYear) return false;
  const currentYear = new Date().getUTCFullYear();
  return birthYear <= (currentYear - years);
}

// Precisa al día (disponible si la necesitas)
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
  const passInput = document.getElementById('lpassword');
  const submitBtn = document.getElementById('loginSubmit');
  const msg = document.getElementById('loginMsg');
  const spinner = document.getElementById('loginSpinner');

  // RFC5322 “lite” (suficiente para front)
  const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;

  const show = (text, ok = false) => {
    if (!msg) return;
    msg.textContent = text || '';
    msg.hidden = !text;
    msg.style.color = ok ? '#137a08' : '#b00020';
  };

  const validate = () => {
    const emailOk = EMAIL_RE.test((emailInput.value || '').trim());
    const passOk = !!(passInput.value || '').trim();
    submitBtn.disabled = !(emailOk && passOk);
    // Limpia mensajes cuando ambos campos están bien
    if (emailOk && passOk) show('');
    return !submitBtn.disabled;
  };

  // Validación en tiempo real
  ['input', 'blur'].forEach(evt => {
    emailInput.addEventListener(evt, validate);
    passInput.addEventListener(evt, validate);
  });
  validate();

  const SPINNER_MAX_MS = 3000; // ≤ 3 s
  const SPINNER_MIN_MS = 400;  // se nota “cargando” pero breve

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) {
      show('Ingresa un correo válido y tu contraseña.');
      return;
    }

    // Estado UI
    submitBtn.disabled = true;
    spinner.hidden = false;
    const t0 = performance.now();
    const guard = setTimeout(() => (spinner.hidden = true), SPINNER_MAX_MS);

    try {
      const payload = await loginUser({
        email: (emailInput.value || '').trim(),
        password: (passInput.value || '').trim()
      });

      // Asegura spinner visible un instante
      const elapsed = performance.now() - t0;
      if (elapsed < SPINNER_MIN_MS) {
        await new Promise(r => setTimeout(r, SPINNER_MIN_MS - elapsed));
      }

      // Guarda token si no lo hizo el service
      if (payload?.token) localStorage.setItem('token', payload.token);

      // Redirige rápido a /board
      location.hash = '#/board';
    } catch (err) {
      const status = err?.status ?? err?.response?.status;

      if (status === 401) {
        show('Correo o contraseña inválidos.');
      } else if (status === 423) {
        show('Cuenta temporalmente bloqueada.');
      } else if (status === 429) {
        show('Demasiados intentos. Inténtalo más tarde.');
      } else if (status >= 500) {
        show('Inténtalo de nuevo más tarde.');
        if (import.meta.env?.DEV) console.error(err);
      } else {
        show(err?.message || 'No pudimos iniciar sesión.');
      }
    } finally {
      clearTimeout(guard);
      spinner.hidden = true;
      submitBtn.disabled = !validate();
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

/** Board */
function initBoard() {
  const formLegacy = document.getElementById('todoForm');
  const inputLegacy = document.getElementById('newTodo');
  const list = document.getElementById('todoList') || document.getElementById('notesList');
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

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      location.hash = '#/login';
    });
  }

  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

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

/* === Forgot Password === */
function initForgot() {
  const form = document.getElementById('forgotForm');
  if (!form) return;

  const emailEl = document.getElementById('femail');
  const msg = document.getElementById('forgotMsg');

  const show = (t, ok = true) => {
    if (!msg) return;
    msg.hidden = !t;
    msg.textContent = t || '';
    msg.style.color = ok ? 'green' : 'red';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    show('');

    const email = (emailEl?.value || '').trim();
    if (!email) return show('Ingresa tu correo.', false);

    try {
      await requestPasswordReset(email);
      show('Si el correo está registrado, te enviamos un enlace.');
    } catch (err) {
      show('No pudimos enviar el enlace. Intenta más tarde.', false);
      if (import.meta.env?.DEV) console.error(err);
    }
  });
}
