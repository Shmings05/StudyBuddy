const question = document.querySelector('#question');
const ask = document.querySelector('#ask');
const answer = document.querySelector('#answer');
const answerTitle = document.querySelector('#answer-title');
const errorBox = document.querySelector('#error');
const studyState = window.studyStorage.loadStudyState();
if (studyState.lastQuestion) question.value = studyState.lastQuestion;
const welcome = document.querySelector('#welcome');
const survey = document.querySelector('#survey');
if (studyState.profile) welcome.hidden = true;
document.querySelector('#change-survey').addEventListener('click', () => { welcome.hidden = false; });
function showAnswer(text) { answer.className = 'answer'; answer.innerHTML = text.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join(''); }
async function askStudyBuddy() {
  const text = question.value.trim(); if (!text) { question.focus(); return; }
  window.studyStorage.saveStudyState({ ...studyState, lastQuestion: text, lastAskedAt: new Date().toISOString() });
  ask.disabled = true; ask.innerHTML = 'Thinking… <span class="spinner">◌</span>'; errorBox.hidden = true; answerTitle.textContent = 'Thinking it through…'; answer.className = 'answer thinking'; answer.innerHTML = '<p>StudyBuddy is reading your question and planning a helpful first step.</p>';
  try { const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: text, profile: studyState.profile || {} }) }); const data = await response.json(); if (data.error) throw data.error; answerTitle.textContent = 'A helpful way to think about it'; showAnswer(data.answer); }
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
