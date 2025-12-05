const NATIVE_HOST_NAME = 'com.leetcode.exporter';
const LEETCODE_BASE = 'https://leetcode.com';

// LeetCode API functions
async function getLeetCodeCookies() {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({ domain: 'leetcode.com' }, (cookies) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      const cookieMap = {};
      for (const cookie of cookies) {
        cookieMap[cookie.name] = cookie.value;
      }
      if (!cookieMap.LEETCODE_SESSION) {
        reject(new Error('Not logged in to LeetCode. Please log in first.'));
        return;
      }
      resolve({ session: cookieMap.LEETCODE_SESSION, csrf: cookieMap.csrftoken || '' });
    });
  });
}

async function leetcodeRequest(url, options = {}) {
  const cookies = await getLeetCodeCookies();
  const headers = {
    'Content-Type': 'application/json',
    'X-CSRFToken': cookies.csrf,
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers
  };
  const response = await fetch(url, { ...options, headers, credentials: 'include' });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please log in to LeetCode.');
    }
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

async function pollLeetCodeResult(submissionId, isTest = false) {
  const checkUrl = `${LEETCODE_BASE}/submissions/detail/${submissionId}/check/`;
  for (let i = 0; i < 60; i++) {
    const result = await leetcodeRequest(checkUrl);
    if (result.state === 'SUCCESS' || result.status_msg) {
      return {
        success: result.status_msg === 'Accepted',
        status: result.status_msg || result.state,
        runtime: result.status_runtime || null,
        runtimePercentile: result.runtime_percentile || null,
        memory: result.status_memory || null,
        memoryPercentile: result.memory_percentile || null,
        compileError: result.full_compile_error || null,
        runtimeError: result.full_runtime_error || null,
        failedTest: result.input_formatted ? {
          input: result.input_formatted,
          expected: result.expected_output,
          actual: result.code_output
        } : null
      };
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('Timeout waiting for result');
}

async function testLeetCodeSolution(slug, questionId, code, language, testCases) {
  const url = `${LEETCODE_BASE}/problems/${slug}/interpret_solution/`;
  const response = await leetcodeRequest(url, {
    method: 'POST',
    body: JSON.stringify({
      data_input: testCases,
      lang: language,
      question_id: questionId,
      typed_code: code
    }),
    headers: { 'Referer': `${LEETCODE_BASE}/problems/${slug}/` }
  });
  if (!response.interpret_id) throw new Error('Failed to start test');
  return pollLeetCodeResult(response.interpret_id, true);
}

async function submitLeetCodeSolution(slug, questionId, code, language) {
  const url = `${LEETCODE_BASE}/problems/${slug}/submit/`;
  const response = await leetcodeRequest(url, {
    method: 'POST',
    body: JSON.stringify({
      judge_type: 'large',
      lang: language,
      question_id: questionId,
      typed_code: code
    }),
    headers: { 'Referer': `${LEETCODE_BASE}/problems/${slug}/` }
  });
  if (!response.submission_id) throw new Error('Failed to start submission');
  return pollLeetCodeResult(response.submission_id, false);
}

function sendToNativeHost(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.success) {
        resolve(response);
      } else {
        reject(new Error(response?.error || 'Unknown error'));
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const extensionId = chrome.runtime.id;

  if (request.action === 'openProblem') {
    sendToNativeHost({ action: 'openProblem', data: request.data })
      .then((response) => sendResponse({ success: true, ...response }))
      .catch((error) => {
        let hint = 'Make sure you ran "leetcode-exporter setup" and the native host is registered.';
        if (error.message.includes('forbidden') || error.message.includes('Access')) {
          hint = `Run this command to register: leetcode-exporter register ${extensionId}`;
        }
        sendResponse({ success: false, error: error.message, hint, extensionId });
      });
    return true;
  }

  if (request.action === 'getConfig') {
    sendToNativeHost({ action: 'getConfig' })
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'setConfig') {
    sendToNativeHost({ action: 'setConfig', key: request.key, value: request.value })
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'testSolution') {
    const { slug, questionId, code, language, testCases } = request.data;
    testLeetCodeSolution(slug, questionId, code, language, testCases)
      .then((result) => sendResponse({ success: true, result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'submitSolution') {
    const { slug, questionId, code, language } = request.data;
    submitLeetCodeSolution(slug, questionId, code, language)
      .then((result) => sendResponse({ success: true, result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});
