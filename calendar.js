
// Calendar Manager class to handle calendar operations
class CalendarManager {
  constructor() {
    this.currentView = 'month';
    this.tasks = [];
    this.selectedDate = new Date();
    this.loadTasks();
  }

  loadTasks() {
    try {
      const savedTasks = localStorage.getItem('taskManagerApp');
      this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.tasks = [];
    }
  }

  getTasksByTag(tag) {
    return tag === 'all' ? this.tasks : this.tasks.filter(task => task.tag === tag);
  }
}

// Initialize calendar when page loads
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('calendar.html')) {
    if (!window.calendarManager) {
      window.calendarManager = new CalendarManager();
    }
    initializeCalendar();
  }
});

function initializeCalendar() {
  const now = new Date();
  const monthDisplay = document.getElementById('current-month');
  if (monthDisplay) {
    monthDisplay.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    updateCalendar(now);
  }

  // Set up event listeners for filters
  document.getElementById('tag-filter')?.addEventListener('change', filterTasks);
  document.getElementById('priority-filter')?.addEventListener('change', filterTasks);
  document.getElementById('task-search')?.addEventListener('input', filterTasks);
}

function generateCalendarDays(month, year) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay();
  const totalDays = lastDay.getDate();

  let calendarHTML = '';
  let dayCount = 1;

  const rows = calendarManager.currentView === 'week' ? 1 : 6;
  const today = new Date();

  for (let i = 0; i < (rows * 7); i++) {
    if (calendarManager.currentView === 'week') {
      const currentDate = new Date(calendarManager.selectedDate);
      currentDate.setDate(currentDate.getDate() - currentDate.getDay() + i);
      const isToday = currentDate.toDateString() === today.toDateString();
      const dayTasks = getTasksForDate(currentDate);
      
      calendarHTML += generateDayCell(currentDate, isToday, dayTasks);
    } else {
      if (i < startingDay || dayCount > totalDays) {
        calendarHTML += '<div class="calendar-day empty"></div>';
      } else {
        const currentDate = new Date(year, month, dayCount);
        const isToday = currentDate.toDateString() === today.toDateString();
        const dayTasks = getTasksForDate(currentDate);
        
        calendarHTML += generateDayCell(currentDate, isToday, dayTasks);
        dayCount++;
      }
    }
  }

  return calendarHTML;
}

function generateDayCell(date, isToday, tasks) {
  const classes = ['calendar-day'];
  if (isToday) classes.push('today');
  if (tasks.length > 0) classes.push('has-tasks');

  const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  
  return `
    <div class="${classes.join(' ')}" data-date="${formattedDate}">
      <div class="day-header">
        <span class="day-number">${date.getDate()}</span>
        ${isToday ? '<span class="today-marker">Today</span>' : ''}
      </div>
      <div class="day-tasks">
        ${generateTaskList(tasks)}
      </div>
    </div>
  `;
}

function generateTaskList(tasks) {
  const filteredTasks = filterTasksByCurrentFilters(tasks);
  if (filteredTasks.length === 0) return '';

  // Sort tasks by priority and due date
  const sortedTasks = filteredTasks.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const isOverdue = (task) => new Date(task.dueDate) < new Date();
  const taskHTML = sortedTasks.slice(0, 3).map(task => {
    const overdueClass = isOverdue(task) ? 'overdue' : '';
    return `
      <div class="task-preview ${task.priority}-priority ${overdueClass}" 
           title="${task.title} - ${task.priority} priority${isOverdue(task) ? ' (OVERDUE)' : ''}">
        <span class="priority-dot"></span>
        <span class="task-title">${truncateText(task.title, 15)}</span>
        <span class="task-tag ${task.tag}">${task.tag}</span>
      </div>
    `;
  }).join('');

  return taskHTML + (sortedTasks.length > 3 ? 
    `<div class="more-tasks">+${sortedTasks.length - 3} more</div>` : '');
}

function filterTasksByCurrentFilters(tasks) {
  const tagFilter = document.getElementById('tag-filter')?.value || 'all';
  const priorityFilter = document.getElementById('priority-filter')?.value || 'all';
  const searchText = document.getElementById('task-search')?.value.toLowerCase() || '';

  return tasks.filter(task => {
    const matchesTag = tagFilter === 'all' || task.tag === tagFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesSearch = task.title.toLowerCase().includes(searchText);
    return matchesTag && matchesPriority && matchesSearch;
  });
}

function getTasksForDate(date) {
  return calendarManager.tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate.toDateString() === date.toDateString();
  });
}

function updateCalendar(date) {
  const monthDisplay = document.getElementById('current-month');
  const calendarGrid = document.getElementById('calendar-grid');
  
  if (!monthDisplay || !calendarGrid) return;
  
  monthDisplay.textContent = date.toLocaleString('default', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Create temporary container
  const temp = document.createElement('div');
  temp.innerHTML = generateCalendarDays(date.getMonth(), date.getFullYear());
  
  // Clear and update grid
  calendarGrid.innerHTML = '';
  Array.from(temp.children).forEach(child => {
    calendarGrid.appendChild(child);
  });

  calendarManager.selectedDate = date;
  calendarManager.loadTasks();
  
  const displayText = calendarManager.currentView === 'week' 
    ? `Week of ${date.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
  monthDisplay.textContent = displayText;
  calendarGrid.innerHTML = generateCalendarDays(date.getMonth(), date.getFullYear());

  // Add click handlers for days
  document.querySelectorAll('.calendar-day').forEach(day => {
    if (!day.classList.contains('empty')) {
      day.addEventListener('click', () => {
        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
        day.classList.add('selected');
        showTasksForDate(day.dataset.date);
      });
    }
  });
}

function switchView(view) {
  calendarManager.currentView = view;
  document.querySelectorAll('.view-toggle button').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(view));
  });
  updateCalendar(calendarManager.selectedDate);
}

function notifyTaskDue(task) {
  if (Notification.permission === 'granted') {
    const notification = new Notification('Task Due Soon', {
      body: `${task.title} is due in 1 hour`,
      icon: '/generated-icon.png'
    });
  }
}

function checkTasksDue() {
  const oneHour = 60 * 60 * 1000;
  calendarManager.tasks.forEach(task => {
    const dueDate = new Date(task.dueDate);
    const timeUntilDue = dueDate - new Date();
    if (timeUntilDue > 0 && timeUntilDue <= oneHour) {
      notifyTaskDue(task);
    }
  });
}

setInterval(checkTasksDue, 300000); // Check every 5 minutes

function addQuickTask() {
  const modal = document.getElementById('quick-add-modal');
  if (modal) {
    modal.style.display = 'flex';
    const form = document.getElementById('quick-task-form');
    if (form) {
      form.onsubmit = function(e) {
        e.preventDefault();
        const title = document.getElementById('quick-task-title').value;
        const date = document.getElementById('quick-task-date').value;
        const priority = document.getElementById('quick-task-priority').value;
        const tag = document.getElementById('quick-task-tag').value;
        
        const task = {
          id: 'task-' + Date.now(),
          title,
          description: 'Quick task',
          tag,
          priority,
          assignee: 'Unassigned',
          dueDate: date,
          status: 'task-ready',
          createdAt: new Date().toISOString()
        };
        
        calendarManager.tasks.push(task);
        localStorage.setItem('taskManagerApp', JSON.stringify(calendarManager.tasks));
        updateCalendar(new Date(date));
        closeModal('quick-add-modal');
      };
    }
  }
}

function prevPeriod() {
  const date = new Date(calendarManager.selectedDate);
  if (calendarManager.currentView === 'week') {
    date.setDate(date.getDate() - 7);
  } else {
    date.setMonth(date.getMonth() - 1);
  }
  updateCalendar(date);
}

function nextPeriod() {
  const date = new Date(calendarManager.selectedDate);
  if (calendarManager.currentView === 'week') {
    date.setDate(date.getDate() + 7);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  updateCalendar(date);
}

function showTasksForDate(dateString) {
  const tasksList = document.getElementById('tasks-list');
  if (!tasksList) return;

  const date = new Date(dateString);
  const tasks = getTasksForDate(date);
  const filteredTasks = filterTasksByCurrentFilters(tasks);

  tasksList.innerHTML = filteredTasks.map(task => `
    <div class="task-item ${task.priority}-priority">
      <div class="task-header">
        <h4>${task.title}</h4>
        <span class="task-tag ${task.tag}">${task.tag}</span>
      </div>
      <div class="task-details">
        <span><i class="fas fa-clock"></i> ${new Date(task.dueDate).toLocaleTimeString()}</span>
        <span><i class="fas fa-flag"></i> ${task.priority}</span>
        <span><i class="fas fa-tasks"></i> ${task.status}</span>
      </div>
    </div>
  `).join('') || '<p>No tasks for this date</p>';
}

function filterTasks() {
  updateCalendar(calendarManager.selectedDate);
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function exportTasks() {
  const tasks = calendarManager.tasks;
  const csv = [
    ['Title', 'Due Date', 'Status', 'Priority', 'Tag'].join(','),
    ...tasks.map(task => [
      task.title,
      task.dueDate,
      task.status,
      task.priority,
      task.tag
    ].join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tasks.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}
