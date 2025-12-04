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
  if (request.action === 'openProblem') {
    sendToNativeHost({
      action: 'openProblem',
      data: request.data
    })
      .then((response) => {
        sendResponse({ success: true, ...response });
      })
      .catch((error) => {
        console.error('Native messaging error:', error);

        // Provide specific help for access forbidden errors
        const extensionId = chrome.runtime.id;
        let hint = 'Make sure you ran "leetcode-exporter setup" and the native host is registered.';

        if (error.message.includes('forbidden') || error.message.includes('Access')) {
          hint = `Run this command to register: leetcode-exporter register ${extensionId}`;
        }

        sendResponse({
          success: false,
          error: error.message,
          hint: hint,
          extensionId: extensionId
        });
      });

    return true;
  }
});
