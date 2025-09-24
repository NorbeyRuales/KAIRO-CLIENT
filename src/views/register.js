import { registerUser } from '../services/userService.js';
import { showToast } from '../api/utils/helpers.js';

export function initRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  // Inputs
  const name = document.getElementById('rname');
  const lastname = document.getElementById('rlastname');
  const birthdate = document.getElementById('rbirthdate');
  const email = document.getElementById('remail');
  const pass1 = document.getElementById('rpassword');
  const pass2 = document.getElementById('rpassword2');

  // Errores
  const errName = document.getElementById('errName');
  const errLast = document.getElementById('errLast');
  const errBirth = document.getElementById('errBirth');
  const errEmail = document.getElementById('errEmail');
  const errPass = document.getElementById('errPass');
  const errPass2 = document.getElementById('errPass2');

  const spinner = document.getElementById('regSpinner');
  const msg = document.getElementById('regMsg');

  // Función de validación
  const validate = () => {
    let valid = true;

    if (!name.value.trim()) {
      errName.textContent = 'Debes ingresar tus nombres';
      errName.hidden = false;
      valid = false;
    } else errName.hidden = true;

    if (!lastname.value.trim()) {
      errLast.textContent = 'Debes ingresar tus apellidos';
      errLast.hidden = false;
      valid = false;
    } else errLast.hidden = true;

    if (!birthdate.value) {
      errBirth.textContent = 'Selecciona tu fecha de nacimiento';
      errBirth.hidden = false;
      valid = false;
    } else errBirth.hidden = true;

    if (!email.value.trim()) {
      errEmail.textContent = 'Debes ingresar un correo';
      errEmail.hidden = false;
      valid = false;
    } else errEmail.hidden = true;

    if (pass1.value.length < 6) {
      errPass.textContent = 'La contraseña debe tener al menos 6 caracteres';
      errPass.hidden = false;
      valid = false;
    } else errPass.hidden = true;

    if (pass1.value !== pass2.value) {
      errPass2.textContent = 'Las contraseñas no coinciden';
      errPass2.hidden = false;
      valid = false;
    } else errPass2.hidden = true;

    return valid;
  };

  // Validación en tiempo real
  [name, lastname, birthdate, email, pass1, pass2].forEach(el =>
    el.addEventListener('input', validate)
  );

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    msg.hidden = true;
    spinner.hidden = false;

    try {
      await registerUser({
        name: name.value.trim(),
        lastname: lastname.value.trim(),
        birthdate: birthdate.value,
        email: email.value.trim(),
        password: pass1.value.trim(),
      });

      showToast('Cuenta creada con éxito 🎉');
      location.hash = '#/login';
    } catch (err) {
      msg.textContent = err.message || 'Error al registrar';
      msg.hidden = false;
    } finally {
      spinner.hidden = true;
    }
  });
}
