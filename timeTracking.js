
class TimeTracker {
  constructor() {
    this.startTime = null;
    this.taskId = null;
  }

  startTracking(taskId) {
    this.taskId = taskId;
    this.startTime = new Date();
    localStorage.setItem(`tracking_${taskId}`, this.startTime.toISOString());
  }

  stopTracking() {
    if (!this.startTime || !this.taskId) return 0;
    
    const endTime = new Date();
    const duration = endTime - this.startTime;
    
    const task = tasks.find(t => t.id === this.taskId);
    if (task) {
      task.timeSpent = (task.timeSpent || 0) + duration;
      saveToLocalStorage();
    }
    
    localStorage.removeItem(`tracking_${this.taskId}`);
    this.startTime = null;
    this.taskId = null;
    
    return duration;
  }
}

const timeTracker = new TimeTracker();
