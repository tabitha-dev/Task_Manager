
const LOCAL_STORAGE_KEY_NOTES = 'taskManagerNotes';
let notes = [];

document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    renderNotes();
});

function loadNotes() {
    const savedNotes = localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
    notes = savedNotes ? JSON.parse(savedNotes) : [];
}

function saveNotes() {
    localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(notes));
}

function addNewNote() {
    document.getElementById('modal-title').textContent = 'Add New Note';
    document.getElementById('note-form').reset();
    document.getElementById('note-modal').style.display = 'flex';
}

function closeNoteModal() {
    document.getElementById('note-modal').style.display = 'none';
}

document.getElementById('note-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;
    const tags = document.getElementById('note-tags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);

    const note = {
        id: Date.now(),
        title,
        content,
        tags,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };

    notes.push(note);
    saveNotes();
    renderNotes();
    closeNoteModal();
});

function renderNotes(notesToRender = notes) {
    const notesGrid = document.getElementById('notes-grid');
    if (!notesGrid) return;

    notesGrid.innerHTML = '';
    notesToRender.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-card';
        noteElement.innerHTML = `
            <div class="note-header">
                <h3>${note.title}</h3>
                <div class="note-actions">
                    <button class="btn-icon" onclick="editNote(${note.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteNote(${note.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="note-content">${note.content}</div>
            <div class="note-footer">
                <div class="note-tags">
                    ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <span class="note-date">
                    ${new Date(note.lastModified).toLocaleDateString()}
                </span>
            </div>
        `;
        notesGrid.appendChild(noteElement);
    });
}

function editNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    document.getElementById('modal-title').textContent = 'Edit Note';
    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;
    document.getElementById('note-tags').value = note.tags.join(', ');
    
    const form = document.getElementById('note-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        note.title = document.getElementById('note-title').value;
        note.content = document.getElementById('note-content').value;
        note.tags = document.getElementById('note-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
        note.lastModified = new Date().toISOString();
        
        saveNotes();
        renderNotes();
        closeNoteModal();
        form.onsubmit = null;
    };
    
    document.getElementById('note-modal').style.display = 'flex';
}

function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    notes = notes.filter(note => note.id !== noteId);
    saveNotes();
    renderNotes();
}

function searchNotes() {
    const searchText = document.getElementById('search-notes').value.toLowerCase();
    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchText) ||
        note.content.toLowerCase().includes(searchText) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchText))
    );
    renderNotes(filteredNotes);
}
