
// Notification System
function initializeNotifications() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  Notification.requestPermission();
}

function sendNotification(title, message) {
  if (Notification.permission === "granted") {
    new Notification(title, { body: message });
  }
}

function checkDueDates() {
  const tasks = JSON.parse(localStorage.getItem('taskManagerApp')) || [];
  const today = new Date();
  
  tasks.forEach(task => {
    const dueDate = new Date(task.dueDate);
    if (dueDate.toDateString() === today.toDateString()) {
      sendNotification('Task Due Today', `${task.title} is due today!`);
    }
  });
}

// Check due dates every hour
setInterval(checkDueDates, 3600000);
