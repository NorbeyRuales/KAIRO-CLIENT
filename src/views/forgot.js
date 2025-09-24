import { requestPasswordReset } from '../services/forgot.js';
import { showToast } from '../api/utils/helpers.js';

export function initForgot() {
  const form = document.getElementById('forgotForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('femail').value;

    try {
      await requestPasswordReset(email);
      showToast('Se ha enviado un correo de recuperación');
    } catch (err) {
      document.getElementById('forgotMsg').textContent = 'Error: ' + err.message;
    }
  });
}
