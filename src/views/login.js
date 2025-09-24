import { loginUser } from '../services/userService.js';
import { showToast } from '../api/utils/helpers.js';

export function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput = document.getElementById('lemail');
  const passInput = document.getElementById('lpassword');
  const termsCheck = document.getElementById('termsCheck');
  const submitBtn = document.getElementById('loginSubmit');
  const spinner = document.getElementById('loginSpinner');
  const msg = document.getElementById('loginMsg');

  const validate = () => {
    const valid = emailInput.value.trim() && passInput.value.trim() && termsCheck.checked;
    submitBtn.disabled = !valid;
    return valid;
  };

  [emailInput, passInput, termsCheck].forEach(el => el.addEventListener('input', validate));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    msg.hidden = true;
    submitBtn.disabled = true;
    spinner.hidden = false;

    try {
      const { token } = await loginUser({
        email: emailInput.value.trim(),
        password: passInput.value.trim()
      });

      localStorage.setItem('token', token);
      showToast('Bienvenido 👋');
      location.hash = '#/board';
    } catch (err) {
      msg.textContent = err.message || 'Error al iniciar sesión';
      msg.hidden = false;
    } finally {
      spinner.hidden = true;
      submitBtn.disabled = false;
    }
  });
}
