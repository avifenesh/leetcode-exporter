const NATIVE_HOST_NAME = 'com.leetcode.exporter';

// Save cookies to config whenever we can
async function syncCookiesToConfig() {
  try {
    const cookies = await new Promise((resolve) => {
      chrome.cookies.getAll({ domain: 'leetcode.com' }, resolve);
    });
    const cookieMap = {};
    for (const c of cookies) cookieMap[c.name] = c.value;
    if (cookieMap.LEETCODE_SESSION) {
      await sendToNativeHost({
        action: 'setConfig',
        key: 'leetcodeSession',
        value: cookieMap.LEETCODE_SESSION
      });
      if (cookieMap.csrftoken) {
        await sendToNativeHost({
          action: 'setConfig',
          key: 'leetcodeCsrf',
          value: cookieMap.csrftoken
        });
      }
    }
  } catch (e) {
    // Ignore errors - native host may not be set up yet
  }
}

// Sync cookies on extension load and periodically
syncCookiesToConfig();
setInterval(syncCookiesToConfig, 60000);

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

// Handle extension icon click - open current problem in editor
chrome.action.onClicked.addListener(async (tab) => {
  // Only work on LeetCode problem pages
  if (!tab.url?.includes('leetcode.com/problems/')) {
    return;
  }

  try {
    // Get problem data from content script
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getProblemData' });
    if (!response?.success || !response.data) {
      throw new Error('Could not extract problem data');
    }

    // Open in editor via native host
    await sendToNativeHost({ action: 'openProblem', data: response.data });
  } catch (error) {
    console.error('Failed to open problem:', error);
    // Show error notification
    chrome.notifications?.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'LeetCode Exporter',
      message: `Failed to open: ${error.message}`
    });
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
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
});
