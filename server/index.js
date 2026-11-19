const fs = require('fs');
const http = require('http');
const path = require('path');
const { askStudyBuddy } = require('./ai');
const root = path.join(__dirname, '..');
const port = Number(process.env.PORT || 3000);
const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
function send(response, status, body, type = 'application/json') {
  response.writeHead(status, { 'Content-Type': `${type}; charset=utf-8` });
  response.end(type === 'application/json' ? JSON.stringify(body) : body);
}
const server = http.createServer((request, response) => {
  if (request.method === 'POST' && request.url === '/api/ask') {
    let raw = '';
    request.on('data', chunk => { raw += chunk; });
    request.on('end', async () => {
      try {
        const question = JSON.parse(raw).question?.trim();
        if (!question) return send(response, 400, { error: { message: 'Please type a homework question first.', fix: 'Add a question and try again.' } });
        send(response, 200, await askStudyBuddy(question));
      } catch (error) { send(response, 400, { error: { message: 'StudyBuddy could not read that request.', fix: 'Try typing the question again.' } }); }
    });
    return;
  }
  const requested = request.url === '/' ? '/index.html' : request.url;
  const file = path.normalize(path.join(root, requested));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(response, 404, 'Not found', 'text/plain');
  send(response, 200, fs.readFileSync(file), types[path.extname(file)] || 'text/plain');
});
server.listen(port, () => console.log(`StudyBuddy is running at http://localhost:${port}`));
