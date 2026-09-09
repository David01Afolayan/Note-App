const STORAGE_KEY = "proNoteStudioNotes";
const MAX_NOTE_LENGTH = 500;

const state = {
notes: [],
filter: "all",
sort: "newest",
query: "",
editingId: null,
};

const els = {
noteInput: document.getElementById("noteInput"),
addBtn: document.getElementById("addBtn"),
resetBtn: document.getElementById("resetBtn"),
notesContainer: document.getElementById("notes"),
search: document.getElementById("search"),
categoryFilter: document.getElementById("categoryFilter"),
categorySelect: document.getElementById("categorySelect"),
totalNotesStat: document.getElementById("totalNotesStat"),
categoryStat: document.getElementById("categoryStat"),
saveStatusStat: document.getElementById("saveStatusStat"),
composerTitle: document.getElementById("composerTitle"),
charCount: document.getElementById("charCount"),
themeToggle: document.getElementById("themeToggle"),
clearAllBtn: document.getElementById("clearAllBtn"),
exportBtn: document.getElementById("exportBtn"),
quickFilters: document.getElementById("quickFilters"),
};

const sortButtons = document.querySelectorAll(".sort-btn");
const filterChips = document.querySelectorAll(".chip");

function createId() {
return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function formatDate(dateString) {
return new Date(dateString).toLocaleString("en-US", {
month: "short",
day: "numeric",
year: "numeric",
hour: "numeric",
minute: "2-digit",
});
}

function getVisibleNotes() {
const query = state.query.trim().toLowerCase();
let filtered = [...state.notes];

if (state.filter !== "all") {
filtered = filtered.filter((note) => note.category === state.filter);
}

if (query) {
filtered = filtered.filter((note) =>
  note.text.toLowerCase().includes(query) || note.category.toLowerCase().includes(query)
);
}

filtered.sort((a, b) => {
const first = new Date(a.updatedAt || a.createdAt).getTime();
const second = new Date(b.updatedAt || b.createdAt).getTime();
return state.sort === "newest" ? second - first : first - second;
});

return filtered;
}

function renderStats() {
const categories = new Set(state.notes.map((note) => note.category));
els.totalNotesStat.textContent = String(state.notes.length);
els.categoryStat.textContent = String(categories.size || 0);
els.saveStatusStat.textContent = state.notes.length ? "Saved" : "Ready";
}

function saveNotes() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
renderStats();
els.saveStatusStat.textContent = "Saved";
} catch (error) {
console.error("Failed to save notes:", error);
els.saveStatusStat.textContent = "Error";
}
}

function loadNotes() {
try {
const stored = localStorage.getItem(STORAGE_KEY);
state.notes = stored ? JSON.parse(stored) : [];
if (!Array.isArray(state.notes)) {
  state.notes = [];
}
} catch (error) {
console.error("Failed to load notes:", error);
state.notes = [];
}

renderNotes();
renderStats();
}

function renderNotes() {
const visibleNotes = getVisibleNotes();
els.notesContainer.innerHTML = "";

if (!visibleNotes.length) {
const emptyState = document.createElement("div");
emptyState.className = "empty-state";
emptyState.innerHTML = `
  <strong>No notes found</strong>
  <span>Add a fresh idea or change your search filter.</span>
`;
els.notesContainer.appendChild(emptyState);
return;
}

visibleNotes.forEach((note) => {
const card = document.createElement("article");
card.className = `note-card ${note.category.toLowerCase()}`;

card.innerHTML = `
  <div class="note-card-header">
    <span class="note-badge">${note.category}</span>
    <div class="note-actions">
      <button class="note-action-btn" data-action="edit" data-id="${note.id}" type="button">Edit</button>
      <button class="note-action-btn delete" data-action="delete" data-id="${note.id}" type="button">Delete</button>
    </div>
  </div>
  <p class="note-text">${escapeHtml(note.text)}</p>
  <div class="note-meta">
    <span>Updated ${formatDate(note.updatedAt || note.createdAt)}</span>
    <span class="meta-dot"></span>
    <span>${note.category}</span>
  </div>
`;

els.notesContainer.appendChild(card);
});
}

function escapeHtml(value) {
return value
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/\"/g, "&quot;")
.replace(/'/g, "&#039;");
}

function resetComposer() {
state.editingId = null;
els.noteInput.value = "";
els.categorySelect.value = "Work";
els.composerTitle.textContent = "New note";
els.addBtn.textContent = "Add note";
updateCharCount();
els.noteInput.focus();
}

function updateCharCount() {
const count = els.noteInput.value.length;
els.charCount.textContent = `${count} / ${MAX_NOTE_LENGTH}`;
}

function addNote() {
const text = els.noteInput.value.trim();
const category = els.categorySelect.value;

if (!text) {
els.noteInput.focus();
els.noteInput.classList.add("shake");
setTimeout(() => els.noteInput.classList.remove("shake"), 350);
return;
}

if (state.editingId) {
const noteToUpdate = state.notes.find((note) => note.id === state.editingId);
if (noteToUpdate) {
  noteToUpdate.text = text;
  noteToUpdate.category = category;
  noteToUpdate.updatedAt = new Date().toISOString();
}
} else {
state.notes.unshift({
  id: createId(),
  text,
  category,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
}

saveNotes();
renderNotes();
resetComposer();
}

function deleteNote(id) {
state.notes = state.notes.filter((note) => note.id !== id);
saveNotes();
renderNotes();
if (state.editingId === id) {
resetComposer();
}
}

function startEditing(id) {
const note = state.notes.find((item) => item.id === id);
if (!note) return;

state.editingId = id;
els.noteInput.value = note.text;
els.categorySelect.value = note.category;
els.composerTitle.textContent = "Edit note";
els.addBtn.textContent = "Save changes";
updateCharCount();
els.noteInput.focus();
els.noteInput.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearAllNotes() {
if (!state.notes.length) {
return;
}

const confirmed = window.confirm("Clear all notes? This action cannot be undone.");
if (!confirmed) {
return;
}

state.notes = [];
localStorage.removeItem(STORAGE_KEY);
renderNotes();
renderStats();
resetComposer();
}

function exportNotes() {
if (!state.notes.length) {
window.alert("There are no notes to export yet.");
return;
}

const content = state.notes
.slice()
.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
.map((note) => `[${note.category}] ${formatDate(note.updatedAt || note.createdAt)}\n${note.text}\n-----\n`)
.join("\n");

const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
const url = URL.createObjectURL(blob);
const link = document.createElement("a");
link.href = url;
link.download = "pronote-export.txt";
link.click();
URL.revokeObjectURL(url);
}

function applyTheme() {
const isDark = document.body.classList.contains("dark-theme");
els.themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

function toggleTheme() {
document.body.classList.toggle("dark-theme");
localStorage.setItem("proNoteTheme", document.body.classList.contains("dark-theme") ? "dark" : "light");
applyTheme();
}

function handleListClick(event) {
const button = event.target.closest("button[data-action]");
if (!button) return;

const { action, id } = button.dataset;
if (action === "delete") deleteNote(id);
if (action === "edit") startEditing(id);
}

function attachEvents() {
els.addBtn.addEventListener("click", addNote);
els.resetBtn.addEventListener("click", resetComposer);
els.clearAllBtn.addEventListener("click", clearAllNotes);
els.exportBtn.addEventListener("click", exportNotes);
els.themeToggle.addEventListener("click", toggleTheme);
els.search.addEventListener("input", (event) => {
state.query = event.target.value;
renderNotes();
});
els.categoryFilter.addEventListener("change", (event) => {
state.filter = event.target.value;
renderNotes();
});
els.noteInput.addEventListener("input", updateCharCount);
els.notesContainer.addEventListener("click", handleListClick);

sortButtons.forEach((button) => {
button.addEventListener("click", () => {
  state.sort = button.dataset.sort;
  sortButtons.forEach((item) => item.classList.toggle("active", item === button));
  renderNotes();
});
});

filterChips.forEach((button) => {
button.addEventListener("click", () => {
  const selectedFilter = button.dataset.filter;
  state.filter = selectedFilter;
  els.categoryFilter.value = selectedFilter === "all" ? "all" : selectedFilter;
  filterChips.forEach((chip) => chip.classList.toggle("active", chip === button));
  renderNotes();
});
});
}

function initializeApp() {
const savedTheme = localStorage.getItem("proNoteTheme");
if (savedTheme === "dark") {
document.body.classList.add("dark-theme");
}

applyTheme();
loadNotes();
attachEvents();
resetComposer();
}

initializeApp();

// Add animation styles
let style = 
document.createElement("style");

style.textContent = `
@keyframes slideInOut {
0% {
transform: translateX(400px);
opacity: 0;
}
50% {
opacity: 1;
}
100% {
transform: translateX(400px);
opacity: 0;
}
}

@keyframes slideOut {
0% {
transform: translateX(0);
opacity: 1;
}
100% {
transform: translateX(400px);
opacity: 0;
}
}

/* Save indicator styling */
div[style*="position: fixed"][style*="top: 20px"] {
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
`;

document.head.appendChild(style);