// Get extension ID and generate command
const extensionId = chrome.runtime.id;
const command = `leetcode-exporter register ${extensionId}`;

document.getElementById('command').textContent = command;

document.getElementById('copyBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(command);
    const btn = document.getElementById('copyBtn');
    btn.textContent = 'Copied!';
    btn.classList.add('success');
    document.getElementById('status').textContent = 'Paste in terminal and press Enter';

    setTimeout(() => {
      btn.textContent = 'Copy Command';
      btn.classList.remove('success');
    }, 3000);
  } catch (err) {
    document.getElementById('status').textContent = 'Failed to copy - please select and copy manually';
  }
});
