const fs = require('fs');
const path = require('path');
const { getKey, invalidateKey } = require('./minddo-key');

const model = 'gpt-5.6-luna';
const brief = fs.readFileSync(path.join(__dirname, '..', 'BRIEF.md'), 'utf8');
const systemInstructions = `${brief}\n\nImportant correction: never present guesses as facts. If unsure, say so and suggest checking with a teacher.`;

function errorReply(error) {
  console.error(error.fix || 'StudyBuddy AI request failed.');
  return { error: { message: error.message || 'StudyBuddy could not answer right now.', fix: error.fix } };
}

async function askStudyBuddy(question) {
  try {
    let key = await getKey();
    let response = await callOpenAI(key, question);
    if (response.status === 401) {
      invalidateKey();
      key = await getKey();
      response = await callOpenAI(key, question);
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

function callOpenAI(key, question) {
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: systemInstructions }, { role: 'user', content: question }] }),
  });
}

module.exports = { askStudyBuddy };
