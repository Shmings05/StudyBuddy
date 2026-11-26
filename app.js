const question = document.querySelector('#question');
const ask = document.querySelector('#ask');
const answer = document.querySelector('#answer');
const answerTitle = document.querySelector('#answer-title');
const errorBox = document.querySelector('#error');
const studyState = window.studyStorage.loadStudyState();
const conversation = studyState.conversation || [];
const welcome = document.querySelector('#welcome');
const survey = document.querySelector('#survey');
if (studyState.profile) welcome.hidden = true;
document.querySelector('#change-survey').addEventListener('click', () => { welcome.hidden = false; });
function safeText(text) { return text.replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[character])); }
function showAnswer(text) {
  answer.className = 'answer';
  answer.innerHTML = text.split(/\n\n+/).map(p => `<p>${safeText(p).replace(/\n/g, '<br>')}</p>`).join('');
  if (window.MathJax) window.MathJax.typesetPromise([answer]);
}
function showConversation() {
  answer.innerHTML = conversation.map(item => `<div class="chat-bubble ${item.role}"><b>${item.role === 'user' ? 'You' : 'StudyBuddy'}</b><div>${safeText(item.content).replace(/\n/g, '<br>')}</div></div>`).join('');
  if (window.MathJax) window.MathJax.typesetPromise([answer]);
}
async function askStudyBuddy() {
  const text = question.value.trim(); if (!text) { question.focus(); return; }
  conversation.push({ role: 'user', content: text });
  window.studyStorage.saveStudyState({ ...studyState, lastQuestion: text, conversation, lastAskedAt: new Date().toISOString() });
  ask.disabled = true; ask.innerHTML = 'Thinking… <span class="spinner">◌</span>'; errorBox.hidden = true; answerTitle.textContent = 'Thinking it through…'; answer.className = 'answer thinking'; answer.innerHTML = '<p>StudyBuddy is reading your question and planning a helpful first step.</p>';
  try { const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: text, profile: studyState.profile || {}, history: conversation.slice(0, -1) }) }); const data = await response.json(); if (data.error) throw data.error; conversation.push({ role: 'assistant', content: data.answer }); window.studyStorage.saveStudyState({ ...studyState, conversation }); answerTitle.textContent = 'Our conversation'; showConversation(); }
  catch (error) { answerTitle.textContent = 'Let’s try again'; errorBox.textContent = error.message || 'Please check the internet and try again.'; errorBox.hidden = false; answer.className = 'answer empty'; answer.innerHTML = '<p>Your question is still here. You can try again in a moment.</p>'; }
  finally { ask.disabled = false; ask.innerHTML = 'Get help <span>→</span>'; }
}
ask.addEventListener('click', askStudyBuddy);
question.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); askStudyBuddy(); } });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => { question.value = `${question.value.trim()}\n\n${button.dataset.prompt}`.trim(); question.focus(); }));
survey.addEventListener('submit', event => {
  event.preventDefault();
  studyState.profile = { grade: document.querySelector('#grade').value, subject: document.querySelector('#subject').value, style: document.querySelector('#style').value };
  window.studyStorage.saveStudyState(studyState);
  welcome.hidden = true;
});
