// Task Manager App

// Constants
const LOCAL_STORAGE_KEY = 'taskManagerApp';

// Calendar Manager initialization
let calendarManager;
if (typeof CalendarManager !== 'undefined') {
  calendarManager = new CalendarManager();
} else {
  calendarManager = {
    tasks: [],
    selectedDate: new Date(),
    loadTasks: function() {
      try {
        const savedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
        this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
      } catch (error) {
        console.error('Error loading tasks:', error);
        this.tasks = [];
      }
    }
  };
}

// State Management
class TaskManager {
  constructor() {
    this.tasks = [];
    this.cache = new Map();
    this.loadTasks();
    this.debouncedFilter = this.debounce(this.filterTasks, 300);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  loadTasks() {
    try {
      const savedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
      this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.tasks = [];
    }
  }

  saveTasks() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  getTasksByStatus(status) {
    const cacheKey = `status_${status}`;
    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, this.tasks.filter(task => task.status === status));
    }
    return this.cache.get(cacheKey);
  }
}

const taskManager = new TaskManager();
let currentPage = window.location.pathname.split('/').pop() || 'index.html';

// Initialize current page
function initializePage() {
  switch(currentPage) {
    case 'index.html':
      loadFromLocalStorage();
      updateTaskCounts();
      updateClockAndDate();
      setInterval(updateClockAndDate, 1000);
      break;
    case 'calendar.html':
      const now = new Date();
      document.getElementById('current-month').textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      updateCalendar(now);
      break;
    case 'settings.html':
      loadSettingsState();
      break;
    case 'teams.html':
      // Teams page specific initialization
      break;
  }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initializePage();

  // Add click handlers for navigation
  document.querySelectorAll('.sidebar a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = e.target.closest('a').getAttribute('href').replace('#', '');
      handleNavigation(section);
    });
  });
});

// Task Functions
function addTask() {
  try {
    const title = document.getElementById('task-title')?.value.trim();
    const desc = document.getElementById('task-desc')?.value.trim();
    const tag = document.getElementById('task-tags')?.value.trim();

    if (!title) throw new Error('Task title is required');
    if (!desc) throw new Error('Task description is required');

    const priority = document.getElementById('task-priority').value;
    const assignee = document.getElementById('task-assignee').value;
    const dueDate = document.getElementById('due-date').value;

    // Update team member's assigned tasks count
    const teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
    const assignedMember = teamMembers.find(member => member.name === assignee);
    if (assignedMember) {
      assignedMember.tasksAssigned++;
      localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    }

    const task = {
      id: 'task-' + Date.now(),
      title,
      description: desc,
      tag: tag || 'general',
      priority,
      assignee,
      dueDate,
      status: 'task-ready',
      createdAt: new Date().toISOString()
    };

    tasks.push(task);
    renderTask(task);
    saveToLocalStorage();
    closeModal('add-task-modal');
    updateTaskCounts();
    clearTaskForm();
  } catch (error) {
    alert(error.message);
  }
}

// Quick Add Task Function
function quickAddTask(columnId) {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  if (currentPage === 'calendar.html') {
    const modal = document.getElementById('quick-add-modal');
    if (modal) {
      modal.style.display = 'flex';
    }
    return;
  }
  
  const inputId = `quick-add-${columnId}`;
  const input = document.getElementById(inputId);
  if (!input) return;

  const title = input.value.trim();
  if (!title) return;

  const task = {
    id: 'task-' + Date.now(),
    title,
    description: 'Quick task',
    tag: 'general',
    priority: 'medium',
    assignee: 'Unassigned',
    dueDate: new Date().toISOString().split('T')[0],
    status: columnId,
    createdAt: new Date().toISOString()
  };

  tasks.push(task);
  renderTask(task);
  input.value = '';
  saveToLocalStorage();
  updateTaskCounts();
}

// Task Edit Functions
function editTask(taskId) {
  if (!document.getElementById('add-task-modal')) return;
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('task-title').value = task.title;
  document.getElementById('task-desc').value = task.description;
  document.getElementById('task-tags').value = task.tag;
  document.getElementById('task-priority').value = task.priority;
  document.getElementById('task-assignee').value = task.assignee;
  document.getElementById('due-date').value = task.dueDate;

  // Store task ID being edited
  document.getElementById('add-task-modal').dataset.editTaskId = taskId;
  openModal('add-task-modal');
}

function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  const index = tasks.findIndex(t => t.id === taskId);
  if (index > -1) {
    tasks.splice(index, 1);
    document.getElementById(taskId)?.remove();
    saveToLocalStorage();
    updateTaskCounts();
  }
}

function renderTask(task) {
  const taskElement = document.createElement('div');
  taskElement.className = `task ${task.priority}-priority`;
  taskElement.id = task.id;
  taskElement.draggable = true;
  taskElement.ondragstart = drag;

  const isArchived = task.status === 'archived-tasks';
  const isDone = task.status === 'done';

  taskElement.innerHTML = `
    <h4>${task.title}</h4>
    <p>${task.description}</p>
    <div class="task-meta">
      <span class="task-tag ${task.tag}">${capitalize(task.tag)}</span>
      <span class="task-user">Assigned: ${task.assignee}</span>
      <span class="task-due">Due: ${task.dueDate}</span>
    </div>
    <div class="task-actions">
      ${!isArchived ? `
        <button class="btn-secondary small-btn" onclick="editTask('${task.id}')">Edit</button>
        <button class="btn-secondary small-btn" onclick="addComment('${task.id}')">Comment</button>
        ${!isDone ? `
          <button class="btn-secondary small-btn" onclick="moveTask('${task.id}', 'in-progress')">Move to Progress</button>
          <button class="btn-secondary small-btn" onclick="moveTask('${task.id}', 'needs-review')">Need Review</button>
          <button class="btn-secondary small-btn" onclick="moveTask('${task.id}', 'done')">Mark Done</button>
        ` : `
          <button class="btn-secondary small-btn" onclick="moveTask('${task.id}', 'archived-tasks')">Archive</button>
        `}
      ` : ''}
      <button class="btn-danger small-btn" onclick="deleteTask('${task.id}')">Delete</button>
    </div>
  `;

  const column = document.querySelector(`#${task.status} .task-list`);
  if (column) column.appendChild(taskElement);
}

// UI Helpers
function clearTaskForm() {
  document.getElementById('task-title').value = '';
  document.getElementById('task-desc').value = '';
  document.getElementById('task-tags').value = '';
  document.getElementById('task-priority').value = 'medium';
  document.getElementById('task-assignee').value = 'Unassigned';
  document.getElementById('due-date').value = new Date().toISOString().split('T')[0];
}

function updateTaskCounts() {
  document.getElementById('total-tasks').textContent = tasks.length;
  document.getElementById('completed-tasks').textContent = tasks.filter(t => t.status === 'done').length;
  document.getElementById('archived-tasks-count').textContent = tasks.filter(t => t.status === 'archived-tasks').length;

  const today = new Date();
  const overdueTasks = tasks.filter(task => {
    const dueDate = new Date(task.dueDate);
    return dueDate < today && task.status !== 'done' && task.status !== 'archived-tasks';
  }).length;

  document.getElementById('overdue-tasks').textContent = overdueTasks;
  updateProgressBars();
}

function updateProgressBars() {
  const columns = ['task-ready', 'in-progress', 'needs-review', 'done'];

  columns.forEach(columnId => {
    const column = document.getElementById(columnId);
    const totalTasks = column.querySelectorAll('.task').length;
    const progress = totalTasks === 0 ? 0 : (totalTasks / tasks.length) * 100;

    const progressBar = column.querySelector('.progress');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.title = `${Math.round(progress)}% Complete`;
    }
  });
}

// Drag and Drop
function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData('taskId', ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  const taskId = ev.dataTransfer.getData('taskId');
  const task = document.getElementById(taskId);
  const column = ev.target.closest('.task-column');

  if (task && column) {
    const taskList = column.querySelector('.task-list');
    taskList.appendChild(task);

    // Update task status in state
    const taskData = tasks.find(t => t.id === taskId);
    if (taskData) {
      taskData.status = column.id;
      saveToLocalStorage();
      updateTaskCounts();
    }
  }
}

// Storage
function saveToLocalStorage() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
}

function loadFromLocalStorage() {
  const savedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedTasks) {
    try {
      const parsedTasks = JSON.parse(savedTasks);
      if (Array.isArray(parsedTasks)) {
        tasks = parsedTasks;
        tasks.forEach(task => renderTask(task));
      } else {
        tasks = [];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.error('Error loading tasks:', e);
      tasks = [];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    }
  } else {
    tasks = [];
  }
}

// Utilities
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateClockAndDate() {
  const now = new Date();
  const clock = document.getElementById('clock');
  const date = document.getElementById('current-date');

  if (clock) clock.textContent = now.toLocaleTimeString();
  if (date) date.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Modal Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    modal.dataset.editTaskId = '';
  }
}

// Navigation
function handleNavigation(section) {
  window.location.href = section;
}

// Initialize app
document.addEventListener('DOMContentLoaded', initializePage);


// Initialize current page content
function initializePageContent() {
  const main = document.querySelector('.main');
  if (!main) return;

  main.style.display = 'block';
  main.innerHTML = `
    <header class="main-header">
      <h1>Task Management</h1>
      <div class="actions">
        <button class="btn-primary" onclick="openModal('add-task-modal')">+ Add Task</button>
        <button class="btn-secondary" onclick="toggleDarkMode()">Toggle Dark Mode</button>
      </div>
    </header>
    <div class="filters">
      <input type="text" id="task-search" oninput="filterTasks()" placeholder="Search tasks...">
      <select id="filter-tasks" onchange="filterTasks()">
        <option value="all">All Tasks</option>
        <option value="high-priority">High Priority</option>
        <option value="low-priority">Low Priority</option>
        <option value="completed">Completed</option>
      </select>
      <select id="sort-tasks" onchange="sortTasks()">
        <option value="due-date">Sort by Due Date</option>
        <option value="priority">Sort by Priority</option>
        <option value="title">Sort by Title</option>
      </select>
    </div>
    <section class="widgets">
      <div class="widget">
        <h3>Total Tasks</h3>
        <p id="total-tasks">0</p>
      </div>
      <div class="widget">
        <h3>Completed Tasks</h3>
        <p id="completed-tasks">0</p>
      </div>
      <div class="widget">
        <h3>Overdue Tasks</h3>
        <p id="overdue-tasks">0</p>
      </div>
      <div class="widget">
        <h3>Archived Tasks</h3>
        <p id="archived-tasks-count">0</p>
      </div>
    </section>
    <section class="task-columns">
      <!-- Task columns will be populated by renderTask() -->
    </section>
  `;
  updateProgressBars();
  updateTaskCounts();
  renderAllTasks();
}


function initializeTeams() {
  const main = document.querySelector('.main');
  if (!main) return;

  main.innerHTML = `
    <header class="main-header">
      <h1>Team Management</h1>
      <button class="btn-primary" onclick="openModal('add-participant-modal')">+ Add Team Member</button>
    </header>
    <div class="teams-container">
      <div class="team-members">
        <h2>Team Members</h2>
        <div class="team-grid" id="team-grid"></div>
      </div>
    </div>
  `;

  renderTeamMembers();
}

function initializeCalendar() {
  const main = document.querySelector('.main');
  if (!main) return;

  const now = new Date();
  main.innerHTML = `
    <header class="main-header">
      <h1>Calendar View</h1>
      <div class="calendar-nav">
        <button class="btn-secondary" onclick="prevMonth()">&lt; Previous</button>
        <h2 id="current-month">${now.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <button class="btn-secondary" onclick="nextMonth()">Next &gt;</button>
      </div>
    </header>
    <div class="calendar-container">
      <div class="calendar-header">
        <div>Sunday</div>
        <div>Monday</div>
        <div>Tuesday</div>
        <div>Wednesday</div>
        <div>Thursday</div>
        <div>Friday</div>
        <div>Saturday</div>
      </div>
      <div class="calendar-grid" id="calendar-grid">
        ${generateCalendarDays(now.getMonth(), now.getFullYear())}
      </div>
      <div class="calendar-legend">
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--tag-bug)"></span>
          <span>Overdue Tasks</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--accent)"></span>
          <span>Today's Tasks</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--tag-development)"></span>
          <span>Upcoming Tasks</span>
        </div>
      </div>
    </div>
    <div class="daily-tasks" id="daily-tasks">
      <h3>Tasks for Selected Date</h3>
      <div class="tasks-list"></div>
    </div>
  `;

  // Initialize calendar with tasks
  highlightTaskDays();

  // Add click handlers for days
  document.querySelectorAll('.calendar-day').forEach(day => {
    day.addEventListener('click', () => {
      const date = day.dataset.date;
      if (date) {
        showTasksForDate(date);
      }
    });
  });
}

function initializeSettings() {
  const main = document.querySelector('.main');
  if (!main) return;

  main.innerHTML = `
    <header class="main-header">
      <h1>Settings</h1>
    </header>
    <div class="settings-container">
      <div class="setting-item">
        <h3>Theme</h3>
        <button onclick="toggleDarkMode()" class="btn-secondary">Toggle Dark Mode</button>
      </div>
      <div class="setting-item">
        <h3>Notifications</h3>
        <label><input type="checkbox" id="notificationToggle" onchange="toggleNotifications()"> Enable Desktop Notifications</label>
      </div>
      <div class="setting-item">
        <h3>Default Task View</h3>
        <select id="defaultView" onchange="updateDefaultView()">
          <option value="all">All Tasks</option>
          <option value="active">Active Tasks</option>
          <option value="archived">Archived Tasks</option>
        </select>
      </div>
      <div class="setting-item">
        <h3>Auto Archive</h3>
        <label><input type="checkbox" id="autoArchive" onchange="toggleAutoArchive()"> Auto-archive completed tasks after 7 days</label>
      </div>
      <div class="setting-item">
        <h3>Clear Data</h3>
        <button onclick="clearAllData()" class="btn-danger">Clear All Data</button>
      </div>
    </div>
  `;
  loadSettingsState();
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
    tasks = [];
    location.reload();
  }
}

function renderAllTasks() {
  // Clear all task lists
  document.querySelectorAll('.task-list').forEach(list => list.innerHTML = '');

  // Re-render all tasks
  tasks.forEach(task => renderTask(task));
}

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

// Task Filtering and Sorting
function filterTasks() {
  const searchQuery = document.getElementById('task-search')?.value.toLowerCase() || '';
  const tasks = document.querySelectorAll('.task');

  tasks.forEach(task => {
    const title = task.querySelector('h4')?.textContent.toLowerCase() || '';
    const description = task.querySelector('p')?.textContent.toLowerCase() || '';
    const matches = title.includes(searchQuery) || description.includes(searchQuery);
    task.style.display = matches ? 'block' : 'none';
  });

  updateProgressBars();

  // Only update calendar if we're on the calendar page
  const isCalendarPage = window.location.pathname.includes('calendar.html');
  if (isCalendarPage && typeof updateCalendar === 'function' && calendarManager?.selectedDate) {
    updateCalendar(calendarManager.selectedDate);
  }
}

function sortTasks() {
  const sortValue = document.getElementById('sort-tasks').value;
  const columns = document.querySelectorAll('.task-list');

  columns.forEach(column => {
    const taskElements = Array.from(column.querySelectorAll('.task'));
    const sortedTasks = taskElements.sort((a, b) => {
      const taskA = tasks.find(t => t.id === a.id);
      const taskB = tasks.find(t => t.id === b.id);
      if (!taskA || !taskB) return 0;

      switch(sortValue) {
        case 'due-date':
          return new Date(taskA.dueDate) - new Date(taskB.dueDate);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[taskB.priority] - priorityOrder[taskA.priority];
        case 'title':
          return taskA.title.localeCompare(taskB.title);
        default:
          return 0;
      }
    });

    sortedTasks.forEach(task => column.appendChild(task));
  });
}

function moveTask(taskId, newStatus) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    const oldStatus = task.status;
    task.status = newStatus;

    // Update team member's completed tasks count when task is moved to 'done'
    if (newStatus === 'done') {
      const teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
      const assignedMember = teamMembers.find(member => member.name === task.assignee);
      if (assignedMember) {
        assignedMember.tasksCompleted++;
        localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
      }
    }

    if (newStatus === 'archived-tasks') {
      task.archivedDate = new Date().toISOString();
    }

    // Remove the task element from its current column
    const taskElement = document.getElementById(taskId);
    if (taskElement) {
      taskElement.remove();
    }

    // Re-render the task in the new column
    renderTask(task);
    saveToLocalStorage();
    updateTaskCounts();
  }
}

function addComment(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    document.getElementById('comments-title').textContent = `Comments for: ${task.title}`;
    document.getElementById('comments-modal').dataset.taskId = taskId;

    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '';

    if (task.comments) {
      task.comments.forEach(comment => {
        const li = document.createElement('li');
        li.textContent = comment;
        commentsList.appendChild(li);
      });
    }

    openModal('comments-modal');
  }
}

// Calendar Helper Functions
function generateCalendarDays(month, year) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  let calendarHTML = '';
  let dayCount = 1;

  // Create calendar grid
  for (let i = 0; i < 42; i++) {
    if (i < startingDay || dayCount > totalDays) {
      calendarHTML += '<div class="calendar-day"></div>';
    } else {
      const isToday = dayCount === new Date().getDate() &&
                      month === new Date().getMonth() &&
                      year === new Date().getFullYear();
      calendarHTML += `
        <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${year}-${month + 1}-${dayCount}">
          ${dayCount}
        </div>
      `;
      dayCount++;
    }
  }

  return calendarHTML;
}

function highlightTaskDays() {
  const taskManager = new TaskManager();
  taskManager.loadTasks();
  taskManager.tasks.forEach(task => {
    const taskDate = new Date(task.dueDate);
    const dateString = `${taskDate.getFullYear()}-${taskDate.getMonth() + 1}-${taskDate.getDate()}`;
    const dayElement = document.querySelector(`.calendar-day[data-date="${dateString}"]`);
    if (dayElement) {
      const today = new Date();
      const isOverdue = taskDate < today && task.status !== 'done' && task.status !== 'archived-tasks';
      const isTodayTask = taskDate.toDateString() === today.toDateString();

      if (isOverdue) {
        dayElement.classList.add('has-tasks', 'overdue');
      } else if (isTodayTask) {
        dayElement.classList.add('has-tasks', 'today-task');
      } else {
        dayElement.classList.add('has-tasks');
      }
    }
  });
}

function prevMonth() {
  const currentMonth = document.getElementById('current-month');
  const date = new Date(currentMonth.textContent);
  date.setMonth(date.getMonth() - 1);
  updateCalendar(date);
}

function nextMonth() {
  const currentMonth = document.getElementById('current-month');
  const date = new Date(currentMonth.textContent);
  date.setMonth(date.getMonth() + 1);
  updateCalendar(date);
}

function updateCalendar(date) {
  const monthDisplay = document.getElementById('current-month');
  const calendarGrid = document.getElementById('calendar-grid');

  monthDisplay.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
  calendarGrid.innerHTML = generateCalendarDays(date.getMonth(), date.getFullYear());
  highlightTaskDays();
  showTasksForDate(date.toISOString().split('T')[0]); // Show tasks for the updated month.
}

function submitComment() {
  const taskId = document.getElementById('comments-modal').dataset.taskId;
  const commentText = document.getElementById('comment-text').value.trim();

  if (commentText && taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      if (!task.comments) task.comments = [];
      task.comments.push(commentText);
      saveToLocalStorage();
      document.getElementById('comment-text').value = '';
      addComment(taskId); // Refresh comments display
    }
  }
}

function showTasksForDate(dateString) {
  const tasksList = document.getElementById('tasks-list');
  const dailyTasks = document.querySelector('.daily-tasks .tasks-list');
  const targetElement = tasksList || dailyTasks;

  if (!targetElement) return;

  const date = new Date(dateString);
  const tasks = getTasksForDate(date);
  const filteredTasks = tasks; // Simplified for now, add filtering later if needed

    targetElement.innerHTML = '';

    filteredTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'daily-task';
        taskElement.innerHTML = `
            <h4>${task.title}</h4>
            <p>Due: ${task.dueDate}</p>
        `;
        targetElement.appendChild(taskElement);
    });
}

// Placeholder functions -  replace with actual implementations
function renderTeamMembers() {}

function getTasksForDate(date) {
    return taskManager.tasks.filter(task => {
        return new Date(task.dueDate).toLocaleDateString() === date.toLocaleDateString();
    });
}