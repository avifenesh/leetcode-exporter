const NATIVE_HOST_NAME = 'com.leetcode.exporter';

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
});
