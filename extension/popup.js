const extensionId = chrome.runtime.id;
const command = `leetcode-exporter register ${extensionId}`;

document.getElementById('command').textContent = command;

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');

    if (tab.dataset.tab === 'settings') {
      loadConfig();
    }
  });
});

// Copy command
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

// Load config
async function loadConfig() {
  const status = document.getElementById('settingsStatus');
  status.textContent = 'Loading...';
  status.className = 'status';

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
    if (response.success && response.config) {
      document.getElementById('editor').value = response.config.editor || 'auto';
      document.getElementById('workspaceDir').value = response.config.workspaceDir || '';
      status.textContent = '';
    } else {
      status.textContent = response.error || 'Failed to load config';
      status.className = 'status error';
    }
  } catch (err) {
    status.textContent = 'Run setup first: leetcode-exporter setup';
    status.className = 'status error';
  }
}

// Save config
document.getElementById('saveBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveBtn');
  const status = document.getElementById('settingsStatus');
  btn.disabled = true;
  status.textContent = 'Saving...';
  status.className = 'status';

  try {
    const editor = document.getElementById('editor').value;
    const workspaceDir = document.getElementById('workspaceDir').value;

    await chrome.runtime.sendMessage({ action: 'setConfig', key: 'editor', value: editor });
    if (workspaceDir) {
      await chrome.runtime.sendMessage({ action: 'setConfig', key: 'workspaceDir', value: workspaceDir });
    }

    btn.textContent = 'Saved!';
    btn.classList.add('success');
    status.textContent = '';
    setTimeout(() => {
      btn.textContent = 'Save Settings';
      btn.classList.remove('success');
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    status.textContent = err.message || 'Failed to save';
    status.className = 'status error';
    btn.disabled = false;
  }
});
