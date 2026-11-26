const { askStudyBuddy } = require('../server/ai');

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: { message: 'StudyBuddy only accepts homework questions here.', fix: 'Send a POST request with a question.' } });
  }

  try {
    const question = request.body?.question?.trim();
    if (!question) {
      return response.status(400).json({ error: { message: 'Please type a homework question first.', fix: 'Add a question and try again.' } });
    }
    return response.status(200).json(await askStudyBuddy(question, request.body.profile || {}));
  } catch (error) {
    console.error(error.fix || 'StudyBuddy request failed.');
    return response.status(500).json({ error: { message: error.message || 'StudyBuddy could not answer right now.', fix: error.fix } });
  }
};
