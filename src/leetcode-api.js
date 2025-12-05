const https = require('https');
const userConfig = require('./user-config');

const LEETCODE_BASE = 'https://leetcode.com';

function getCredentials() {
  const session = userConfig.get('leetcodeSession');
  const csrf = userConfig.get('leetcodeCsrf');
  if (!session) {
    throw new Error('Not logged in. Visit LeetCode in Chrome with the extension installed.');
  }
  return { session, csrf: csrf || '' };
}

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const creds = getCredentials();
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `LEETCODE_SESSION=${creds.session}; csrftoken=${creds.csrf}`,
        'X-CSRFToken': creds.csrf,
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': options.referer || LEETCODE_BASE,
        ...options.headers
      }
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 401 || res.statusCode === 403) {
          reject(new Error('Auth failed. Re-visit LeetCode in browser to refresh session.'));
          return;
        }
        if (res.statusCode >= 400) {
          reject(new Error(`Request failed: ${res.statusCode}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error));
            return;
          }
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid response'));
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function pollResult(submissionId) {
  const checkUrl = `${LEETCODE_BASE}/submissions/detail/${submissionId}/check/`;
  for (let i = 0; i < 60; i++) {
    const result = await request(checkUrl);
    if (result.state === 'SUCCESS' || result.status_msg) {
      return {
        success: result.status_msg === 'Accepted',
        status: result.status_msg || result.state,
        runtime: result.status_runtime,
        runtimePercentile: result.runtime_percentile,
        memory: result.status_memory,
        memoryPercentile: result.memory_percentile,
        compileError: result.full_compile_error,
        runtimeError: result.full_runtime_error,
        failedInput: result.input_formatted,
        expected: result.expected_output,
        actual: result.code_output,
        totalTests: result.total_testcases,
        passedTests: result.total_correct
      };
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('Timeout waiting for result');
}

async function testSolution(slug, questionId, code, language, testCases) {
  const url = `${LEETCODE_BASE}/problems/${slug}/interpret_solution/`;
  const body = JSON.stringify({
    data_input: testCases,
    lang: language,
    question_id: questionId,
    typed_code: code
  });
  const response = await request(url, {
    method: 'POST',
    body,
    referer: `${LEETCODE_BASE}/problems/${slug}/`
  });
  if (!response.interpret_id) throw new Error('Failed to start test');
  return pollResult(response.interpret_id);
}

async function submitSolution(slug, questionId, code, language) {
  const url = `${LEETCODE_BASE}/problems/${slug}/submit/`;
  const body = JSON.stringify({
    judge_type: 'large',
    lang: language,
    question_id: questionId,
    typed_code: code
  });
  const response = await request(url, {
    method: 'POST',
    body,
    referer: `${LEETCODE_BASE}/problems/${slug}/`
  });
  if (!response.submission_id) throw new Error('Failed to submit');
  return pollResult(response.submission_id);
}

module.exports = { testSolution, submitSolution, getCredentials };
