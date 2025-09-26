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

  // --- Validación por campo ---
  const fields = {
    name: {
      el: name, err: errName,
      check: (v) => v.trim() ? [true, ""] : [false, "Debes ingresar tus nombres"],
    },
    lastname: {
      el: lastname, err: errLast,
      check: (v) => v.trim() ? [true, ""] : [false, "Debes ingresar tus apellidos"],
    },
    birthdate: {
      el: birthdate, err: errBirth,
      check: (v) => v ? [true, ""] : [false, "Selecciona tu fecha de nacimiento"],
    },
    email: {
      el: email, err: errEmail,
      check: (v) => {
        const t = v.trim();
        if (!t) return [false, "Debes ingresar un correo"];
        return /\S+@\S+\.\S+/.test(t) ? [true, ""] : [false, "Ingresa un correo válido"];
      },
    },
    pass1: {
      el: pass1, err: errPass,
      check: (v) => v.length >= 6 ? [true, ""] : [false, "La contraseña debe tener al menos 6 caracteres"],
    },
    pass2: {
      el: pass2, err: errPass2,
      check: (v) => {
        if (!v) return [false, "Repite tu contraseña"];
        if (v.length < 6) return [false, "La contraseña debe tener al menos 6 caracteres"];
        return v === pass1.value ? [true, ""] : [false, "Las contraseñas no coinciden"];
      },
    },
  };

  const touched = Object.fromEntries(Object.keys(fields).map(k => [k, false]));

  function paint(fieldKey, ok, msgText) {
    const { el, err } = fields[fieldKey];
    el.classList.toggle('is-invalid', !ok);
    el.classList.toggle('is-valid', ok);
    el.setAttribute('aria-invalid', String(!ok));
    err.textContent = ok ? "" : msgText;
    err.hidden = ok;             // ← aquí se muestra/oculta el <small>
    return ok;
  }

  function validateField(fieldKey) {
    const { el, check } = fields[fieldKey];
    const [ok, msgText] = check(el.value);
    return paint(fieldKey, ok, msgText);
  }

  function validateAll() {
    let allOk = true;
    Object.keys(fields).forEach(k => {
      touched[k] = true;              // al enviar, marcamos todos como “tocados”
      if (!validateField(k)) allOk = false;
    });
    return allOk;
  }

  // Solo validar el campo que el usuario tocó
  Object.keys(fields).forEach(k => {
    const { el } = fields[k];

    el.addEventListener('blur', () => {
      touched[k] = true;
      validateField(k);
    });

    el.addEventListener('input', () => {
      if (touched[k]) validateField(k);
    });
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

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