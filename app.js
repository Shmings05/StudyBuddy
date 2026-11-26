const question = document.querySelector('#question');
const ask = document.querySelector('#ask');
const answer = document.querySelector('#answer');
const answerTitle = document.querySelector('#answer-title');
const errorBox = document.querySelector('#error');
const studyState = window.studyStorage.loadStudyState();
const resetRequested = new URLSearchParams(window.location.search).has('reset');
if (resetRequested) { delete studyState.profile; window.studyStorage.saveStudyState(studyState); }
const welcome = document.querySelector('#welcome');
const landing = document.querySelector('#landing');
const survey = document.querySelector('#survey');
const conversationList = document.querySelector('#conversation-list');

studyState.conversations ||= [{ id: crypto.randomUUID(), title: 'New conversation', messages: [] }];
studyState.activeConversationId ||= studyState.conversations[0].id;
if (studyState.conversation?.length && !studyState.conversations[0].messages.length) studyState.conversations[0].messages = studyState.conversation;
const activeConversation = () => studyState.conversations.find(item => item.id === studyState.activeConversationId) || studyState.conversations[0];
if (studyState.profile) { welcome.hidden = true; landing.hidden = true; } else welcome.hidden = true;
document.querySelector('#start-studybuddy').addEventListener('click', () => { landing.hidden = true; welcome.hidden = false; });
function saveState() { window.studyStorage.saveStudyState(studyState); }
function safeText(text) { return text.replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[character])); }
function renderConversationList() {
  conversationList.innerHTML = studyState.conversations.map(item => `<button class="conversation-item ${item.id === studyState.activeConversationId ? 'active' : ''}" data-id="${item.id}"><span>✦</span><b>${safeText(item.title)}</b><small>${item.messages.length ? `${item.messages.length} messages` : 'Start a new chat'}</small></button>`).join('');
  conversationList.querySelectorAll('[data-id]').forEach(button => button.addEventListener('click', () => { studyState.activeConversationId = button.dataset.id; saveState(); renderConversationList(); renderMessages(); }));
}
function renderMessages() {
  const messages = activeConversation().messages;
  answerTitle.textContent = messages.length ? 'Our conversation' : 'Your answer will appear here';
  answer.className = messages.length ? 'answer' : 'answer empty';
  answer.innerHTML = messages.length ? messages.map(item => `<div class="chat-bubble ${item.role}"><b>${item.role === 'user' ? 'You' : 'StudyBuddy'}</b><div>${safeText(item.content).replace(/\n/g, '<br>')}</div></div>`).join('') : '<p>Ask a question to get a friendly, step-by-step explanation.</p><p class="small">StudyBuddy will start by explaining what the problem is asking.</p>';
  if (window.MathJax) window.MathJax.typesetPromise([answer]);
}
async function askStudyBuddy() {
  const text = question.value.trim(); if (!text) { question.focus(); return; }
  if (window.location.protocol === 'file:') {
    errorBox.textContent = 'StudyBuddy needs its local server. Open http://localhost:3000 instead of opening index.html directly.';
    errorBox.hidden = false;
    return;
  }
  const chat = activeConversation();
  chat.title = chat.messages.length ? chat.title : text.slice(0, 30);
  chat.messages.push({ role: 'user', content: text });
  saveState(); renderConversationList();
  ask.disabled = true; ask.innerHTML = 'Thinking… <span class="spinner">◌</span>'; errorBox.hidden = true; answerTitle.textContent = 'Thinking it through…'; answer.className = 'answer thinking'; answer.innerHTML = '<p>StudyBuddy is reading your question and planning a helpful first step.</p>';
  try { const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: text, profile: studyState.profile || {}, history: chat.messages.slice(0, -1) }) }); const data = await response.json(); if (data.error) throw data.error; chat.messages.push({ role: 'assistant', content: data.answer }); saveState(); renderMessages(); }
  catch (error) { chat.messages.pop(); saveState(); errorBox.textContent = error.message || 'Please check the internet and try again.'; errorBox.hidden = false; renderMessages(); }
  finally { ask.disabled = false; ask.innerHTML = 'Get help <span>→</span>'; }
}
document.querySelector('#change-survey').addEventListener('click', () => { welcome.hidden = false; });
document.querySelector('#new-conversation').addEventListener('click', () => { const chat = { id: crypto.randomUUID(), title: 'New conversation', messages: [] }; studyState.conversations.unshift(chat); studyState.activeConversationId = chat.id; saveState(); renderConversationList(); renderMessages(); question.value = ''; });
ask.addEventListener('click', askStudyBuddy);
question.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); askStudyBuddy(); } });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => { question.value = `${question.value.trim()}\n\n${button.dataset.prompt}`.trim(); question.focus(); }));
survey.addEventListener('submit', event => { event.preventDefault(); studyState.profile = { grade: document.querySelector('#grade').value, subject: document.querySelector('#subject').value, style: document.querySelector('#style').value }; saveState(); welcome.hidden = true; landing.hidden = true; });
renderConversationList(); renderMessages();
