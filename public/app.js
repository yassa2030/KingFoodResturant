const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function initTooltips() {
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => new bootstrap.Tooltip(el));
}
function initPasswordToggles() {
  document.querySelectorAll('.toggle-pass').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const icon = btn.querySelector('i');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      icon.className = show ? 'bi bi-eye-slash' : 'bi bi-eye';
    });
  });
}
function showToast(message, kind = 'success') {
  const zone = document.getElementById('toastZone');
  if (!zone) return;
  const wrap = document.createElement('div');
  wrap.className = `toast align-items-center text-bg-${kind === 'success' ? 'success' : 'danger'} border-0 show mb-2`;
  wrap.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div></div>`;
  zone.appendChild(wrap);
  setTimeout(() => wrap.remove(), 3000);
}
async function postJSON(url, payload) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
function scorePassword(pwd) {
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[a-z]/.test(pwd)) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^A-Za-z\d]/.test(pwd)) score += 1;
  return score;
}
function updateStrengthUI(pwd) {
  const fill = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  if (!fill || !label) return;
  const score = scorePassword(pwd);
  fill.style.width = `${(score / 5) * 100}%`;
  label.textContent = score <= 2 ? 'Strength: Weak' : score <= 4 ? 'Strength: Medium' : 'Strength: Strong';
  fill.style.backgroundColor = score <= 2 ? '#dc2626' : score <= 4 ? '#f59e0b' : '#16a34a';
}

function setupRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  const password = document.getElementById('password');
  const repeatPassword = document.getElementById('repeatPassword');
  const matchMsg = document.getElementById('matchMsg');
  const emailExistsMsg = document.getElementById('emailExistsMsg');
  password.addEventListener('input', () => updateStrengthUI(password.value));
  repeatPassword.addEventListener('input', () => {
    matchMsg.textContent = repeatPassword.value && repeatPassword.value !== password.value ? 'Passwords do not match.' : '';
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (emailExistsMsg) emailExistsMsg.textContent = '';
    const payload = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: password.value,
      repeatPassword: repeatPassword.value
    };
    if (!passwordPattern.test(payload.password)) return showToast('Password policy not satisfied', 'danger');
    if (payload.password !== payload.repeatPassword) return showToast('Passwords not matching', 'danger');
    try {
      await postJSON('/api/register', payload);
      showToast('Registered successfully');
      setTimeout(() => (location.href = '/login.html'), 900);
    } catch (e2) {
      if (String(e2.message).toLowerCase().includes('already exist')) {
        if (emailExistsMsg) emailExistsMsg.textContent = 'already exist';
      }
      showToast(e2.message, 'danger');
    }
  });
}
function setupLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await postJSON('/api/login', {
        email: document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value,
        rememberMe: document.getElementById('rememberMe').checked
      });
      showToast('Login success');
      setTimeout(() => {
        location.href = data.redirectTo || '/';
      }, 700);
    } catch (e2) {
      showToast(e2.message, 'danger');
    }
  });
}
function setupForgot() {
  const forgot = document.getElementById('forgotForm');
  const reset = document.getElementById('resetForm');
  if (forgot) {
    forgot.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const r = await postJSON('/api/forgot-password', { email: document.getElementById('forgotEmail').value.trim() });
        showToast(`${r.message}${r.resetCode ? ` (Demo code: ${r.resetCode})` : ''}`);
        document.getElementById('resetEmail').value = document.getElementById('forgotEmail').value.trim();
      } catch (e2) {
        showToast(e2.message, 'danger');
      }
    });
  }
  if (reset) {
    reset.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        email: document.getElementById('resetEmail').value.trim(),
        code: document.getElementById('resetCode').value.trim(),
        newPassword: document.getElementById('newPassword').value,
        repeatPassword: document.getElementById('repeatNewPassword').value
      };
      try {
        await postJSON('/api/reset-password', payload);
        showToast('Password updated');
        setTimeout(() => (location.href = '/login.html'), 900);
      } catch (e2) {
        showToast(e2.message, 'danger');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTooltips();
  initPasswordToggles();
  setupRegister();
  setupLogin();
  setupForgot();
});
