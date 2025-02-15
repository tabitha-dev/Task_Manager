
// Teams functionality
let teamMembers = [];

document.addEventListener('DOMContentLoaded', () => {
  loadTeamMembers();
});

function loadTeamMembers() {
  teamMembers = JSON.parse(localStorage.getItem('teamMembers')) || [];
  updateParticipantIcons();
  const teamGrid = document.getElementById('team-grid');
  if (teamGrid) {
    renderTeamMembers();
  }
}

function addParticipant() {
  try {
    const participantName = document.getElementById("participant-name")?.value.trim();
    const participantAvatar = document.getElementById("participant-avatar")?.value.trim();

    if (!participantName) throw new Error('Team member name is required');
    if (!participantAvatar) throw new Error('Avatar URL is required');
    if (teamMembers.some(member => member.name === participantName)) {
      throw new Error('Team member with this name already exists');
    }

    const participant = {
    name: participantName,
    avatar: participantAvatar,
    role: 'Team Member',
    tasksCompleted: 0,
    tasksAssigned: 0
  };

  teamMembers.push(participant);
  localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
  
  updateParticipantIcons();
  renderTeamMembers();
  updateTaskAssignees();
  closeModal("add-participant-modal");

  document.getElementById("participant-name").value = "";
  document.getElementById("participant-avatar").value = "";
  } catch (error) {
    alert(error.message);
  }
}

function removeParticipant(name) {
  teamMembers = teamMembers.filter(member => member.name !== name);
  localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
  updateParticipantIcons();
  renderTeamMembers();
  updateTaskAssignees();
}

function updateParticipantIcons() {
  const participantIcons = document.querySelector('.participant-icons');
  if (!participantIcons) return;

  // Clear existing participants except the add button
  const existingIcons = participantIcons.querySelectorAll('.participant-wrapper');
  existingIcons.forEach(icon => icon.remove());

  // Add participants before the add button
  const addButton = participantIcons.querySelector('button');
  teamMembers.forEach(member => {
    const wrapper = document.createElement('div');
    wrapper.className = 'participant-wrapper';
    wrapper.innerHTML = `
      <img src="${member.avatar}" alt="${member.name}" class="participant" title="${member.name}">
      <button class="participant-remove-btn" onclick="removeParticipant('${member.name}')">×</button>
    `;
    participantIcons.insertBefore(wrapper, addButton);
  });
}

function renderTeamMembers() {
  const teamGrid = document.getElementById('team-grid');
  if (!teamGrid) return;

  teamGrid.innerHTML = '';
  teamMembers.forEach(member => {
    const memberElement = document.createElement('div');
    memberElement.className = 'team-member';
    memberElement.innerHTML = `
      <img src="${member.avatar}" alt="${member.name}">
      <h3>${member.name}</h3>
      <p>${member.role}</p>
      <div class="member-stats">
        <span>${member.tasksCompleted} Tasks Completed</span>
        <span>${member.tasksAssigned} Tasks Assigned</span>
      </div>
      <button class="btn-danger" onclick="removeParticipant('${member.name}')">Remove</button>
    `;
    teamGrid.appendChild(memberElement);
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

function updateTaskAssignees() {
  const assigneeSelect = document.getElementById('task-assignee');
  if (!assigneeSelect) return;

  // Clear current options
  assigneeSelect.innerHTML = '';
  
  // Add team members as options
  teamMembers.forEach(member => {
    const option = document.createElement('option');
    option.value = member.name;
    option.textContent = member.name;
    assigneeSelect.appendChild(option);
  });
}
