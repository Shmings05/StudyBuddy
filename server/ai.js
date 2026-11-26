const fs = require('fs');
const path = require('path');
const { getKey, invalidateKey } = require('./minddo-key');

const model = 'gpt-5.6-luna';
const brief = fs.readFileSync(path.join(__dirname, '..', 'BRIEF.md'), 'utf8');
const systemInstructions = `${brief}\n\nImportant corrections: never present guesses as facts. If unsure, say so and suggest checking with a teacher. Do not directly give the final homework answer first. Start with what the problem is asking, ask what the student tried if needed, and give one small hint or step at a time. Only reveal the final answer after guiding the student, and explain the reasoning so they learn instead of copying. For math, use LaTeX symbols inside \\( \\) for inline equations and \\[ \\] for equations on their own line, so the app can display real math symbols.`;

function errorReply(error) {
  console.error(error.fix || 'StudyBuddy AI request failed.');
  return { error: { message: error.message || 'StudyBuddy could not answer right now.', fix: error.fix } };
}

async function askStudyBuddy(question, profile = {}, history = []) {
  try {
    let key = await getKey();
    let response = await callOpenAI(key, question, profile, history);
    if (response.status === 401) {
      invalidateKey();
      key = await getKey();
      response = await callOpenAI(key, question, profile, history);
    }
    const body = await response.json();
    if (!response.ok) {
      const error = new Error(body?.error?.message || 'StudyBuddy could not answer right now.');
      error.fix = body?.error?.fix || 'Check the internet and try again later.';
      return errorReply(error);
    }
    return { answer: body.choices?.[0]?.message?.content || 'I could not find an answer. Please try asking in a different way.' };
  } catch (error) {
    return errorReply(error);
  }
}

function callOpenAI(key, question, profile, history) {
  const messages = [{ role: 'system', content: systemInstructions }, ...history.filter(item => item.role === 'user' || item.role === 'assistant'), { role: 'user', content: `Student profile: grade=${profile.grade || 'unknown'}, subject=${profile.subject || 'unknown'}, preferred help=${profile.style || 'small steps'}.\n\nHomework question: ${question}` }];
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages }),
  });
}

module.exports = { askStudyBuddy };
