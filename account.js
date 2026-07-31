(() => {
const PRODUCTION_URL = 'https://freshcut-m19.onrender.com';
const LOCAL_URL = `http://${window.location.hostname}:3001`;
const isProduction = window.location.hostname.includes('github.io');
const apiHost = isProduction ? PRODUCTION_URL : LOCAL_URL;

const tokenKey = 'freshcutCustomerToken';
const authView = document.getElementById('authView');
const profileView = document.getElementById('profileView');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authMessage = document.getElementById('authMessage');
const profileMessage = document.getElementById('profileMessage');
const profileMeta = document.getElementById('profileMeta');
const appointmentsList = document.getElementById('appointmentsList');
const emptyState = document.getElementById('emptyState');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const bookingButtons = document.querySelectorAll('.trigger-booking');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const facebookLoginBtn = document.getElementById('facebookLoginBtn');

let currentCustomer = null;

const urlParams = new URLSearchParams(window.location.search);
const oauthToken = urlParams.get('token');
const oauthError = urlParams.get('authError');

if (googleLoginBtn) {
  googleLoginBtn.href = `${apiHost}/auth/google`;
}

if (facebookLoginBtn) {
  facebookLoginBtn.href = `${apiHost}/auth/facebook`;
}

function getToken() {
  return localStorage.getItem(tokenKey);
}

function setToken(token) {
  localStorage.setItem(tokenKey, token);
}

function clearToken() {
  localStorage.removeItem(tokenKey);
}

function setMessage(element, text, isSuccess = false) {
  element.textContent = text;
  element.classList.toggle('success', isSuccess);
}

function showAuth() {
  profileView.classList.add('hidden');
  authView.classList.remove('hidden');
}

function showProfile() {
  authView.classList.add('hidden');
  profileView.classList.remove('hidden');
}

function switchAuthMode(mode) {
  const isLogin = mode === 'login';
  loginTab.classList.toggle('active', isLogin);
  registerTab.classList.toggle('active', !isLogin);
  loginForm.classList.toggle('hidden', !isLogin);
  registerForm.classList.toggle('hidden', isLogin);
  setMessage(authMessage, '');
}

function cleanOAuthParams() {
  if (!oauthToken && !oauthError) return;

  window.history.replaceState({}, document.title, window.location.pathname);
}

function formatDate(dateValue) {
  if (!dateValue) return '-';

  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat('bg-BG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiHost}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      showAuth();
    }

    throw new Error(data.message || 'Заявката не беше успешна.');
  }

  return data;
}

function renderAppointments(appointments) {
  appointmentsList.innerHTML = '';
  emptyState.classList.toggle('hidden', appointments.length > 0);

  appointments.forEach(item => {
    const canCancel = item.status !== 'Cancelled' && item.status !== 'Completed';
    const card = document.createElement('article');
    card.className = 'appointment-card';
    card.innerHTML = `
      <div>
        <div class="appointment-time">${escapeHtml(formatDate(item.date))}</div>
        <div class="appointment-time">${escapeHtml(item.time)}</div>
      </div>
      <div>
        <h3>${escapeHtml(item.service)}</h3>
        <p>${escapeHtml(item.note || 'Без бележка')}</p>
      </div>
      <div>
        <div class="status-badge">${escapeHtml(item.status)}</div>
        <button class="cancel-btn" data-id="${escapeHtml(item.id)}" type="button"${canCancel ? '' : ' disabled'}>Отмени</button>
      </div>
    `;
    appointmentsList.appendChild(card);
  });
}

function fillBookingFormFromProfile() {
  if (!currentCustomer) return;

  const bookingForm = document.getElementById('bookingForm');
  const confirmBox = document.getElementById('confirmBox');
  const nameInput = document.getElementById('name');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');

  if (!bookingForm) return;

  bookingForm.classList.remove('hide');
  confirmBox?.classList.remove('show');

  if (nameInput) nameInput.value = currentCustomer.name || '';
  if (emailInput) emailInput.value = currentCustomer.email || '';
  if (phoneInput && currentCustomer.phone) phoneInput.value = currentCustomer.phone;
}

async function loadProfile() {
  setMessage(profileMessage, 'Зареждане...', true);

  try {
    const [customer, appointments] = await Promise.all([
      apiRequest('/customer/me'),
      apiRequest('/customer/appointments')
    ]);

    currentCustomer = customer;
    profileMeta.textContent = `${customer.name} · ${customer.email}`;
    fillBookingFormFromProfile();
    renderAppointments(appointments);
    setMessage(profileMessage, `Резервации: ${appointments.length}`, true);
    showProfile();
  } catch (error) {
    setMessage(authMessage, error.message);
  }
}

loginTab.addEventListener('click', () => switchAuthMode('login'));
registerTab.addEventListener('click', () => switchAuthMode('register'));

bookingButtons.forEach(button => {
  button.addEventListener('click', fillBookingFormFromProfile);
});

loginForm.addEventListener('submit', async event => {
  event.preventDefault();

  const submitButton = loginForm.querySelector('button[type="submit"]');
  const formData = new FormData(loginForm);

  submitButton.disabled = true;
  setMessage(authMessage, 'Влизане...', true);

  try {
    const data = await apiRequest('/customer/login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password')
      })
    });

    setToken(data.token);
    currentCustomer = data.customer;
    loginForm.reset();
    await loadProfile();
  } catch (error) {
    setMessage(authMessage, error.message);
  } finally {
    submitButton.disabled = false;
  }
});

registerForm.addEventListener('submit', async event => {
  event.preventDefault();

  const submitButton = registerForm.querySelector('button[type="submit"]');
  const formData = new FormData(registerForm);

  submitButton.disabled = true;
  setMessage(authMessage, 'Създаване...', true);

  try {
    const data = await apiRequest('/customer/register', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password')
      })
    });

    setToken(data.token);
    currentCustomer = data.customer;
    registerForm.reset();
    await loadProfile();
  } catch (error) {
    setMessage(authMessage, error.message);
  } finally {
    submitButton.disabled = false;
  }
});

appointmentsList.addEventListener('click', async event => {
  if (!event.target.matches('.cancel-btn')) return;

  const button = event.target;

  if (!confirm('Сигурен ли си, че искаш да отмениш тази резервация?')) {
    return;
  }

  button.disabled = true;
  setMessage(profileMessage, 'Отмяна...', true);

  try {
    await apiRequest(`/customer/appointments/${button.dataset.id}/cancel`, {
      method: 'PUT'
    });
    await loadProfile();
    setMessage(profileMessage, 'Резервацията е отменена.', true);
  } catch (error) {
    setMessage(profileMessage, error.message);
    button.disabled = false;
  }
});

refreshBtn.addEventListener('click', loadProfile);

logoutBtn.addEventListener('click', () => {
  clearToken();
  currentCustomer = null;
  showAuth();
});

if (oauthToken) {
  setToken(oauthToken);
  cleanOAuthParams();
  loadProfile();
} else if (oauthError) {
  clearToken();
  showAuth();
  setMessage(authMessage, oauthError);
  cleanOAuthParams();
} else if (getToken()) {
  loadProfile();
} else {
  showAuth();
}
})();
