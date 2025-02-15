
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Shift + A: Add new task
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    openModal('add-task-modal');
  }
  
  // Ctrl/Cmd + F: Quick filter
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    document.getElementById('task-search')?.focus();
  }
  
  // Escape: Close modals
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.style.display = 'none';
    });
  }
});
