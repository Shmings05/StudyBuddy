const cache = {
  apiKey: null,
  expiresAt: 0,
};

function makeError(message, fix, cause) {
  const error = new Error(message);
  error.fix = fix;
  if (cause) error.cause = cause;
  return error;
}

function readConfig() {
  const url = process.env.KEYGEN_URL;
  const token = process.env.KEYGEN_TOKEN;

  if (!url || !token || url === 'paste-here' || token === 'paste-here') {
    throw makeError(
      'The MindDo key service is not configured.',
      'Put your real KEYGEN_URL and KEYGEN_TOKEN values in the server .env file.'
    );
  }

  return { url: url.replace(/\/$/, ''), token };
}

async function requestKey() {
  const { url, token } = readConfig();
  let response;

  try {
    response = await fetch(`${url}/api/lookup-key`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (cause) {
    throw makeError(
      'StudyBuddy could not reach the AI key service.',
      'Check the server internet connection and KEYGEN_URL, then try again.',
      cause
    );
  }

  let body;
  try {
    body = await response.json();
  } catch (cause) {
    throw makeError(
      'The AI key service sent an unreadable response.',
      'Check that MindDo is running and that KEYGEN_URL points to the correct service.',
      cause
    );
  }

  if (!response.ok || typeof body.apiKey !== 'string' || !body.expiresAt) {
    throw makeError(
      body?.error?.message || 'The AI key service could not provide a key.',
      body?.error?.fix || 'Check the MindDo account and server configuration.',
    );
  }

  const expiresAt = Date.parse(body.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    throw makeError(
      'The AI key service returned an expired key.',
      'Check MindDo and make sure it returns a future expiresAt time.'
    );
  }

  cache.apiKey = body.apiKey;
  cache.expiresAt = expiresAt;
  return cache.apiKey;
}

async function getKey() {
  if (cache.apiKey && cache.expiresAt > Date.now()) return cache.apiKey;
  cache.apiKey = null;
  cache.expiresAt = 0;
  return requestKey();
}

// Call this once when OpenAI reports that the cached key is invalid.
function invalidateKey() {
  cache.apiKey = null;
  cache.expiresAt = 0;
}

module.exports = { getKey, invalidateKey };
