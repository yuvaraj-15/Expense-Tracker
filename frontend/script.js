import { API_URL } from './config.js';

const alertBox = document.getElementById('alert');

const loginFormContainer = document.getElementById('loginFormContainer');
const registerFormContainer = document.getElementById('registerFormContainer');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');

function showAlert(msg, type='error') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  setTimeout(() => alertBox.innerHTML = '', 3000);
}

showRegister.addEventListener('click', e => { e.preventDefault(); loginFormContainer.classList.add('hidden'); registerFormContainer.classList.remove('hidden'); });
showLogin.addEventListener('click', e => { e.preventDefault(); registerFormContainer.classList.add('hidden'); loginFormContainer.classList.remove('hidden'); });

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username, password})
    });
    const data = await res.json();
    if(res.ok) {
      localStorage.setItem('token', data.token);
      window.location.href = 'dashboard.html';
    } else showAlert(data.error || 'Login failed', 'error');
  } catch { showAlert('Server error', 'error'); }
});

registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username, password})
    });
    const data = await res.json();
    if(res.ok) { showAlert('Registered successfully!', 'success'); registerForm.reset(); registerFormContainer.classList.add('hidden'); loginFormContainer.classList.remove('hidden'); }
    else showAlert(data.error || 'Registration failed', 'error');
  } catch { showAlert('Server error', 'error'); }
});
