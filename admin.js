const PRODUCTION_URL = 'https://freshcut-m19.onrender.com';
const LOCAL_URL = `http://${window.location.hostname}:3000`;
const isProduction = window.location.hostname.includes('github.io');
const apiHost = isProduction ? PRODUCTION_URL : LOCAL_URL;

const tokenKey = 'freshcutAdminToken';
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const dashboardMessage = document.getElementById('dashboardMessage');
const appointmentsBody = document.getElementById('appointmentsBody');
const emptyState = document.getElementById('emptyState');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const totalCount = document.getElementById('totalCount');
const pendingCount = document.getElementById('pendingCount');
const confirmedCount = document.getElementById('confirmedCount');
const cancelledCount = document.getElementById('cancelledCount');
const closedDateForm = document.getElementById('closedDateForm');
const closedDateInput = document.getElementById('closedDateInput');
const closedReasonInput = document.getElementById('closedReasonInput');
const closedDatesList = document.getElementById('closedDatesList');
const closedDatesEmpty = document.getElementById('closedDatesEmpty');
const servicesList = document.getElementById('servicesList');
const servicesEmpty = document.getElementById('servicesEmpty');
const serviceModal = document.getElementById('serviceModal');
const serviceForm = document.getElementById('serviceForm');
const serviceModalTitle = document.getElementById('serviceModalTitle');
const closeServiceModalBtn = document.getElementById('closeServiceModalBtn');
const addNewServiceBtn = document.getElementById('addNewServiceBtn');
const serviceIdInput = document.getElementById('serviceId');
const serviceFormMessage = document.getElementById('serviceFormMessage');

let appointments = [];
let closedDates = [];
let services = [];
let currentService = null; // To hold service being edited

function getToken() {
  return localStorage.getItem(tokenKey);
}

function setMessage(element, text, isSuccess = false) {
  element.textContent = text;
  element.classList.toggle('success', isSuccess);
}

function showDashboard() {
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
}

function showLogin() {
  dashboardView.classList.add('hidden');
  loginView.classList.remove('hidden');
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

function updateStats() {
  totalCount.textContent = appointments.length;
  pendingCount.textContent = appointments.filter(item => item.status === 'Pending').length;
  confirmedCount.textContent = appointments.filter(item => item.status === 'Confirmed').length;
  cancelledCount.textContent = appointments.filter(item => item.status === 'Cancelled').length;
}

function getVisibleAppointments() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  return appointments.filter(item => {
    const matchesStatus = status === 'all' || item.status === status;
    const haystack = [
      item.name,
      item.phone,
      item.email,
      item.service,
      item.note,
      item.date,
      item.time
    ].join(' ').toLowerCase();

    return matchesStatus && (!query || haystack.includes(query));
  });
}

function renderAppointments() {
  const visible = getVisibleAppointments();
  appointmentsBody.innerHTML = '';
  emptyState.classList.toggle('hidden', visible.length > 0);

  visible.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(formatDate(item.date))}</td>
      <td class="mono">${escapeHtml(item.time)}</td>
      <td class="client-cell">
        <strong>${escapeHtml(item.name)}</strong>
        <a href="tel:${escapeHtml(item.phone)}">${escapeHtml(item.phone)}</a>
        ${item.email ? `<div class="muted-text">${escapeHtml(item.email)}</div>` : ''}
      </td>
      <td>${escapeHtml(item.service)}</td>
      <td class="muted-text">${escapeHtml(item.note || '-')}</td>
      <td>
        <select class="status-select" data-id="${escapeHtml(item.id)}">
          <option value="Pending"${item.status === 'Pending' ? ' selected' : ''}>Pending</option>
          <option value="Confirmed"${item.status === 'Confirmed' ? ' selected' : ''}>Confirmed</option>
          <option value="Completed"${item.status === 'Completed' ? ' selected' : ''}>Completed</option>
          <option value="Cancelled"${item.status === 'Cancelled' ? ' selected' : ''}>Cancelled</option>
        </select>
      </td>
    `;
    appointmentsBody.appendChild(row);
  });
}

function renderClosedDates() {
  closedDatesList.innerHTML = '';
  closedDatesEmpty.classList.toggle('hidden', closedDates.length > 0);

  closedDates.forEach(item => {
    const pill = document.createElement('div');
    pill.className = 'closed-date-pill';
    pill.innerHTML = `
      <strong>${escapeHtml(formatDate(item.date))}</strong>
      ${item.reason ? `<span>${escapeHtml(item.reason)}</span>` : ''}
      <button class="remove-date-btn" data-date="${escapeHtml(item.date)}" type="button" aria-label="Премахни датата">&times;</button>
    `;
    closedDatesList.appendChild(pill);
  });
}

function renderServices() {
  servicesList.innerHTML = '';
  servicesEmpty.classList.toggle('hidden', services.length > 0);

  services.forEach(service => {
    const card = document.createElement('div');
    card.className = 'service-card-admin';
    card.innerHTML = `
      <div class="info">
        <strong>${escapeHtml(service.name)}</strong>
        <span>${escapeHtml(service.price)} € &middot; ${escapeHtml(service.duration || '-')}</span>
      </div>
      <div class="actions">
        <button class="admin-secondary edit-service-btn" data-id="${escapeHtml(service.id)}" type="button">Редактирай</button>
        <button class="admin-secondary delete-service-btn" data-id="${escapeHtml(service.id)}" type="button">Изтрий</button>
      </div>
    `;
    servicesList.appendChild(card);
  });
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
      localStorage.removeItem(tokenKey);
      showLogin();
    }
    throw new Error(data.message || 'Заявката не беше успешна.');
  }

  return data;
}

async function loadAppointments() {
  refreshBtn.disabled = true;
  setMessage(dashboardMessage, 'Зареждане...', true);

  try {
    appointments = await apiRequest('/admin/appointments');
    updateStats();
    renderAppointments();
    setMessage(dashboardMessage, `Заредени резервации: ${appointments.length}`, true);
  } catch (error) {
    setMessage(dashboardMessage, error.message);
  } finally {
    refreshBtn.disabled = false;
  }
}

async function loadClosedDates() {
  try {
    closedDates = await apiRequest('/admin/closed-dates');
    renderClosedDates();
  } catch (error) {
    setMessage(dashboardMessage, error.message);
  }
}

async function loadServices() {
  try {
    services = await apiRequest('/admin/services');
    renderServices();
  } catch (error) {
    setMessage(dashboardMessage, error.message);
  }
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const submitButton = loginForm.querySelector('button[type="submit"]');
  const formData = new FormData(loginForm);

  submitButton.disabled = true;
  setMessage(loginMessage, 'Влизане...', true);

  try {
    const data = await apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: formData.get('username'),
        password: formData.get('password')
      })
    });

    localStorage.setItem(tokenKey, data.token);
    loginForm.reset();
    setMessage(loginMessage, '');
    showDashboard();
    await Promise.all([loadAppointments(), loadClosedDates(), loadServices()]);
  } catch (error) {
    setMessage(loginMessage, error.message || 'Грешни данни за вход.');
  } finally {
    submitButton.disabled = false;
  }
});

appointmentsBody.addEventListener('change', async event => {
  if (!event.target.matches('.status-select')) return;

  const select = event.target;
  const id = select.dataset.id;
  const status = select.value;
  const previous = appointments.find(item => String(item.id) === String(id))?.status;

  select.disabled = true;
  setMessage(dashboardMessage, 'Запазване...', true);

  try {
    await apiRequest(`/admin/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });

    appointments = appointments.map(item => (
      String(item.id) === String(id) ? { ...item, status } : item
    ));
    updateStats();
    renderAppointments();
    setMessage(dashboardMessage, 'Статусът е обновен.', true);
  } catch (error) {
    if (previous) select.value = previous;
    setMessage(dashboardMessage, error.message);
  } finally {
    select.disabled = false;
  }
});

refreshBtn.addEventListener('click', loadAppointments);

closedDateForm.addEventListener('submit', async event => {
  event.preventDefault();

  const date = closedDateInput.value;
  const reason = closedReasonInput.value.trim();
  const submitButton = closedDateForm.querySelector('button[type="submit"]');

  submitButton.disabled = true;
  setMessage(dashboardMessage, 'Запазване на затворена дата...', true);

  try {
    await apiRequest('/admin/closed-dates', {
      method: 'POST',
      body: JSON.stringify({ date, reason })
    });

    closedDateForm.reset();
    await Promise.all([loadClosedDates(), loadAppointments()]);
    setMessage(dashboardMessage, 'Датата е затворена за резервации.', true);
  } catch (error) {
    setMessage(dashboardMessage, error.message);
  } finally {
    submitButton.disabled = false;
  }
});

closedDatesList.addEventListener('click', async event => {
  if (!event.target.matches('.remove-date-btn')) return;

  const button = event.target;
  const date = button.dataset.date;

  button.disabled = true;
  setMessage(dashboardMessage, 'Премахване на затворена дата...', true);

  try {
    await apiRequest(`/admin/closed-dates/${date}`, {
      method: 'DELETE'
    });

    await Promise.all([loadClosedDates(), loadAppointments()]);
    setMessage(dashboardMessage, 'Датата отново е отворена за резервации.', true);
  } catch (error) {
    setMessage(dashboardMessage, error.message);
    button.disabled = false;
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(tokenKey);
  appointments = [];
  showLogin();
});

searchInput.addEventListener('input', renderAppointments);
statusFilter.addEventListener('change', renderAppointments);

if (getToken()) {
  showDashboard();
  Promise.all([loadAppointments(), loadClosedDates(), loadServices()]);
} else {
  showLogin();
}

function showServiceModal(service = null) {
  currentService = service;
  serviceForm.reset();
  setMessage(serviceFormMessage, '');
  if (service) {
    serviceModalTitle.textContent = 'Редактирай услуга';
    serviceIdInput.value = service.id;
    serviceForm.querySelector('#serviceName').value = service.name;
    serviceForm.querySelector('#servicePrice').value = service.price;
    serviceForm.querySelector('#serviceDuration').value = service.duration || '';
    serviceForm.querySelector('#serviceDescription').value = service.description || '';
    serviceForm.querySelector('#serviceOrder').value = service.display_order || '';
  } else {
    serviceModalTitle.textContent = 'Добави услуга';
    serviceIdInput.value = '';
  }
  serviceModal.classList.remove('hidden');
}

function hideServiceModal() {
  serviceModal.classList.add('hidden');
  currentService = null;
}

addNewServiceBtn.addEventListener('click', () => showServiceModal());
closeServiceModalBtn.addEventListener('click', hideServiceModal);
serviceModal.addEventListener('click', (e) => {
  if (e.target === serviceModal) {
    hideServiceModal();
  }
});

serviceForm.addEventListener('submit', async event => {
  event.preventDefault();
  const submitButton = serviceForm.querySelector('button[type="submit"]');
  const formData = new FormData(serviceForm);
  const id = formData.get('id');

  const serviceData = {
    name: formData.get('name'),
    price: formData.get('price'),
    duration: formData.get('duration'),
    description: formData.get('description'),
    display_order: formData.get('display_order'),
  };

  const method = id ? 'PUT' : 'POST';
  const path = id ? `/admin/services/${id}` : '/admin/services';

  submitButton.disabled = true;
  setMessage(serviceFormMessage, 'Запазване...', true);

  try {
    await apiRequest(path, { method, body: JSON.stringify(serviceData) });
    hideServiceModal();
    await loadServices();
    setMessage(dashboardMessage, 'Услугата е запазена.', true);
  } catch (error) {
    setMessage(serviceFormMessage, error.message);
  } finally {
    submitButton.disabled = false;
  }
});

servicesList.addEventListener('click', async event => {
  const target = event.target;

  if (target.matches('.edit-service-btn')) {
    const id = target.dataset.id;
    const service = services.find(s => String(s.id) === id);
    if (service) {
      showServiceModal(service);
    }
  }

  if (target.matches('.delete-service-btn')) {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази услуга?')) return;

    const id = target.dataset.id;
    target.disabled = true;
    setMessage(dashboardMessage, 'Изтриване...', true);

    try {
      await apiRequest(`/admin/services/${id}`, { method: 'DELETE' });
      await loadServices();
      setMessage(dashboardMessage, 'Услугата е изтрита.', true);
    } catch (error) {
      setMessage(dashboardMessage, error.message);
      target.disabled = false;
    }
  }
});
