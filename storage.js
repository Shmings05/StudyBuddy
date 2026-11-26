const STORAGE_KEY = 'studybuddy-state';
const sampleItems = [
  { subject: 'Science', title: 'Explain photosynthesis', status: 'Sample' },
  { subject: 'Math', title: 'Practice fractions', status: 'Sample' },
  { subject: 'History', title: 'Review primary sources', status: 'Sample' },
];

function loadStudyState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
    return { sampleItems, conversations: [{ id: crypto.randomUUID(), title: 'New conversation', messages: [] }] };
  }
  catch { return { sampleItems }; }
}

function saveStudyState(state) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

window.studyStorage = { loadStudyState, saveStudyState };
