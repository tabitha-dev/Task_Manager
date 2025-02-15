
document.addEventListener('DOMContentLoaded', loadSettingsState);

function loadSettingsState() {
  // Load dark mode
  const darkMode = localStorage.getItem('darkMode') === 'true';
  document.body.classList.toggle('dark-mode', darkMode);

  // Load notifications
  const notifications = localStorage.getItem('notifications') === 'true';
  const notificationToggle = document.getElementById('notificationToggle');
  if (notificationToggle) notificationToggle.checked = notifications;

  // Load default view
  const defaultView = localStorage.getItem('defaultView') || 'all';
  const defaultViewSelect = document.getElementById('defaultView');
  if (defaultViewSelect) defaultViewSelect.value = defaultView;

  // Load auto archive
  const autoArchive = localStorage.getItem('autoArchive') === 'true';
  const autoArchiveToggle = document.getElementById('autoArchive');
  if (autoArchiveToggle) autoArchiveToggle.checked = autoArchive;
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function toggleNotifications() {
  const enabled = document.getElementById('notificationToggle').checked;
  localStorage.setItem('notifications', enabled);
  if (enabled) {
    Notification.requestPermission();
  }
}

function updateDefaultView() {
  const view = document.getElementById('defaultView').value;
  localStorage.setItem('defaultView', view);
}

function toggleAutoArchive() {
  const enabled = document.getElementById('autoArchive').checked;
  localStorage.setItem('autoArchive', enabled);
}

function clearAllData() {
  if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    localStorage.clear();
    location.reload();
  }
}
