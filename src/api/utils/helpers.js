/* ----------------- Helpers ----------------- */
export function showToast(text) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      Object.assign(t.style, {
        position: 'fixed',
        right: '16px',
        bottom: '16px',
        padding: '10px 14px',
        background: '#111',
        color: '#fff',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,.25)',
        zIndex: 9999
      });
      document.body.appendChild(t);
    }
    t.textContent = text;
    t.hidden = false;
    clearTimeout(t._hid);
    t._hid = setTimeout(() => (t.hidden = true), 2200);
  }
  
  export const setFieldError = (el, msgEl, text = '') => {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.hidden = !text;
    if (el) el.setAttribute('aria-invalid', text ? 'true' : 'false');
  };
  
  export const emailLooksValid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  
  export function isAtLeastYearsOldLoose(birthStr, years = 13) {
    const birthYear = parseInt(birthStr.slice(0, 4), 10);
    return birthYear && birthYear <= new Date().getUTCFullYear() - years;
  }
  