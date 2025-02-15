
// Chart configuration and utilities
const chartConfig = {
  colors: {
    status: ['#4299E1', '#48BB78', '#ECC94B', '#9F7AEA'],
    priority: ['#FC8181', '#F6AD55', '#48BB78'],
    team: ['#9F7AEA', '#ECC94B'],
    trend: '#63B3ED'
  },
  defaults: {
    animation: {
      duration: 500,
      easing: 'easeInOutQuad'
    },
    devicePixelRatio: 2,
    elements: {
      line: {
        tension: 0.4
      },
      point: {
        radius: 4,
        hitRadius: 8
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Check if Chart is available
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded');
    document.querySelectorAll('.chart-card').forEach(card => {
      card.innerHTML = '<p class="chart-error">Error: Chart.js library not loaded</p>';
    });
    return;
  }

  // Initialize charts with error handling
  try {
    initializeCharts();
    
    // Handle time range changes
    document.getElementById('timeRange')?.addEventListener('change', (e) => {
      const range = e.target.value;
      initializeCharts(range);
    });
  } catch (error) {
    console.error('Error during chart initialization:', error);
    document.querySelectorAll('.chart-card').forEach(card => {
      card.innerHTML = '<p class="chart-error">Error initializing charts. Please try refreshing the page.</p>';
    });
  }
});

const debouncedInitCharts = debounce((timeRange) => initializeCharts(timeRange), 250);

function initializeCharts(timeRange = 'week') {
  try {
    // Clear cache when time range changes
    if (window.lastTimeRange !== timeRange) {
      taskCache.clear();
      window.lastTimeRange = timeRange;
    }

    // Clean up existing charts
    if (window.taskCharts) {
      Object.values(window.taskCharts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
          chart.destroy();
        }
      });
    }
    
    window.taskCharts = {};
    const tasks = JSON.parse(localStorage.getItem('taskManagerApp')) || [];
    const filteredTasks = filterTasksByTimeRange(tasks, timeRange);
    
    const charts = {
      statusChart: createStatusChart,
      priorityChart: createPriorityChart,
      teamChart: createTeamChart,
      trendChart: createTrendChart,
      burndownChart: createBurndownChart,
      timeMetricsChart: createTimeMetricsChart,
      tagDistributionChart: createTagDistributionChart
    };

    // Create each chart if its canvas exists
    Object.entries(charts).forEach(([id, createFn]) => {
      const canvas = document.getElementById(id);
      if (canvas) {
        window.taskCharts[id] = createFn(filteredTasks, timeRange);
      }
    });

  } catch (error) {
    console.error('Error initializing charts:', error);
    document.querySelectorAll('.chart-card').forEach(card => {
      card.innerHTML = '<p class="error-message">Error loading chart data. Please try again.</p>';
    });
  }
}

const taskCache = new Map();

function debounce(func, wait) {
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

function filterTasksByTimeRange(tasks, range) {
  const cacheKey = `${range}_${tasks.length}`;
  if (taskCache.has(cacheKey)) {
    return taskCache.get(cacheKey);
  }

  const now = new Date();
  const ranges = {
    week: 7,
    month: 30,
    year: 365
  };
  
  const daysAgo = ranges[range] || 7;
  const cutoff = new Date(now.setDate(now.getDate() - daysAgo));
  
  return tasks.filter(task => new Date(task.createdAt) >= cutoff);
}

function createStatusChart(tasks) {
  const ctx = document.getElementById('statusChart').getContext('2d');
  const statuses = ['task-ready', 'in-progress', 'needs-review', 'done'];
  const counts = statuses.map(status => 
    tasks.filter(t => t.status === status).length || 0
  );

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Ready', 'In Progress', 'Review', 'Done'],
      datasets: [{
        data: counts,
        backgroundColor: chartConfig.colors.status,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      ...chartConfig.defaults,
      cutout: '65%',
      plugins: {
        ...chartConfig.defaults.plugins,
        title: {
          display: true,
          text: 'Task Status Distribution',
          padding: 20
        }
      }
    }
  });
}

function createPriorityChart(tasks) {
  const ctx = document.getElementById('priorityChart').getContext('2d');
  const priorities = ['high', 'medium', 'low'];
  const counts = priorities.map(priority =>
    tasks.filter(t => t.priority === priority).length || 0
  );

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        label: 'Tasks by Priority',
        data: counts,
        backgroundColor: chartConfig.colors.priority,
        borderRadius: 8,
        borderWidth: 0
      }]
    },
    options: {
      ...chartConfig.defaults,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      },
      plugins: {
        ...chartConfig.defaults.plugins,
        title: {
          display: true,
          text: 'Tasks by Priority Level',
          padding: 20
        }
      }
    }
  });
}

function createTeamChart(tasks) {
  const ctx = document.getElementById('teamChart').getContext('2d');
  const members = [...new Set(tasks.map(t => t.assignee || 'Unassigned'))];
  
  const completedTasks = members.map(member =>
    tasks.filter(t => t.assignee === member && t.status === 'done').length || 0
  );
  
  const pendingTasks = members.map(member =>
    tasks.filter(t => t.assignee === member && t.status !== 'done').length || 0
  );

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: members,
      datasets: [
        {
          label: 'Completed Tasks',
          data: completedTasks,
          backgroundColor: chartConfig.colors.team[0],
          borderRadius: 8,
          borderWidth: 0
        },
        {
          label: 'Pending Tasks',
          data: pendingTasks,
          backgroundColor: chartConfig.colors.team[1],
          borderRadius: 8,
          borderWidth: 0
        }
      ]
    },
    options: {
      ...chartConfig.defaults,
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      },
      plugins: {
        ...chartConfig.defaults.plugins,
        title: {
          display: true,
          text: 'Team Performance Overview',
          padding: 20
        }
      }
    }
  });
}

function createTrendChart(tasks, timeRange) {
  const ctx = document.getElementById('trendChart').getContext('2d');
  const dates = generateDateRange(timeRange);
  
  const completedByDate = dates.map(date =>
    tasks.filter(t =>
      t.status === 'done' &&
      new Date(t.dueDate).toDateString() === new Date(date).toDateString()
    ).length || 0
  );

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map(d => new Date(d).toLocaleDateString()),
      datasets: [{
        label: 'Completed Tasks',
        data: completedByDate,
        borderColor: chartConfig.colors.trend,
        backgroundColor: `${chartConfig.colors.trend}20`,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: chartConfig.colors.trend
      }]
    },
    options: {
      ...chartConfig.defaults,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        ...chartConfig.defaults.plugins,
        title: {
          display: true,
          text: 'Task Completion Trend',
          padding: 20
        }
      }
    }
  });
}

function generateDateRange(range) {
  const dates = [];
  const days = range === 'month' ? 30 : range === 'year' ? 52 : 7;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

function createBurndownChart(tasks, timeRange) {
  const ctx = document.getElementById('burndownChart')?.getContext('2d');
  if (!ctx) return null;
  
  const dates = generateDateRange(timeRange);
  const totalTasks = tasks.length;
  const remainingTasks = dates.map(date => 
    tasks.filter(t => 
      new Date(t.createdAt) <= new Date(date) && 
      (t.status !== 'done' || new Date(t.dueDate) > new Date(date))
    ).length
  );

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates.map(d => new Date(d).toLocaleDateString()),
      datasets: [{
        label: 'Remaining Tasks',
        data: remainingTasks,
        borderColor: '#FC8181',
        backgroundColor: '#FC818120',
        fill: true
      }]
    },
    options: {
      ...chartConfig.defaults,
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: totalTasks
        }
      }
    }
  });
}

function createTimeMetricsChart(tasks) {
  const ctx = document.getElementById('timeMetricsChart')?.getContext('2d');
  if (!ctx) return null;

  const avgTimeByPriority = ['high', 'medium', 'low'].map(priority => {
    const priorityTasks = tasks.filter(t => t.priority === priority && t.status === 'done');
    if (!priorityTasks.length) return 0;
    return priorityTasks.reduce((acc, task) => 
      acc + (new Date(task.dueDate) - new Date(task.createdAt))
    , 0) / priorityTasks.length / (1000 * 60 * 60 * 24); // Convert to days
  });

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        label: 'Average Completion Time (Days)',
        data: avgTimeByPriority,
        backgroundColor: chartConfig.colors.priority
      }]
    },
    options: {
      ...chartConfig.defaults,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function createTagDistributionChart(tasks) {
  const ctx = document.getElementById('tagDistributionChart')?.getContext('2d');
  if (!ctx) return null;

  const tags = {};
  tasks.forEach(task => {
    const tag = task.tag || 'untagged';
    tags[tag] = (tags[tag] || 0) + 1;
  });

  return new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(tags),
      datasets: [{
        data: Object.values(tags),
        backgroundColor: Object.keys(tags).map((_, i) => 
          `hsl(${(i * 360) / Object.keys(tags).length}, 70%, 60%)`
        )
      }]
    },
    options: {
      ...chartConfig.defaults
    }
  });
}
