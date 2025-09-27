import { initHome } from '../views/home.js';
import { initRegister } from '../views/register.js';
import { initLogin } from '../views/login.js';
import { initForgot } from '../views/forgot.js';
import { initUpdate } from '../views/update.js';
import { initTaskNew } from '../views/taskNew.js';
import { initTaskEdit } from '../views/taskEdit.js';
import { initBoard } from '../views/board.js';

const app = document.getElementById('app');

export function initRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

async function loadView(name) {
  const res = await fetch(new URL(`../views/${name}.html`, import.meta.url));
  if (!res.ok) throw new Error(`Error loading view: ${name}`);
  app.innerHTML = await res.text();

  const inits = {
    home: initHome,
    board: initBoard,
    register: initRegister,
    login: initLogin,
    forgot: initForgot,
    update: initUpdate,
    'task-new': initTaskNew,
  };
  inits[name]?.();
}

function handleRoute() {
  const hash = location.hash.startsWith('#/') ? location.hash.slice(2) : 'login';

  if (hash.startsWith("task/edit/")) {
    const parts = hash.split("/");
    const taskId = parts[2];
    if (taskId) return loadView('task-edit').then(() => initTaskEdit(taskId));
    return loadView('board');
  }

  const viewMap = {
    home: 'home',
    board: 'board',
    login: 'login',
    register: 'register',
    forgot: 'forgot',
    update: 'update',
    'tasks/new': 'task-new'
  };

  const viewName = viewMap[hash] || 'login';
  loadView(viewName).catch(console.error);
}
