const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec, spawn } = require('child_process');
const config = require('./config');

function getNativeHostsDir() {
  const platform = os.platform();
  switch (platform) {
    case 'darwin':
      return path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'NativeMessagingHosts');
    case 'linux':
      return path.join(os.homedir(), '.config', 'google-chrome', 'NativeMessagingHosts');
    case 'win32':
      return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Google', 'Chrome', 'User Data', 'NativeMessagingHosts');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function getNativeHostPath() {
  const wrapper = os.platform() === 'win32' ? 'native-host-wrapper.cmd' : 'native-host-wrapper.sh';
  return path.resolve(__dirname, wrapper);
}

function getExtensionPath() {
  return path.resolve(__dirname, '..', 'extension');
}

function createManifest() {
  return {
    name: config.HOST_NAME,
    description: 'LeetCode Exporter',
    path: getNativeHostPath(),
    type: 'stdio',
    allowed_origins: ['chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/']
  };
}

function copyToClipboard(text) {
  const platform = os.platform();
  try {
    let proc;
    if (platform === 'darwin') {
      proc = spawn('pbcopy', [], { stdio: ['pipe', 'ignore', 'ignore'] });
    } else if (platform === 'linux') {
      proc = spawn('xclip', ['-selection', 'clipboard'], { stdio: ['pipe', 'ignore', 'ignore'] });
    } else if (platform === 'win32') {
      proc = spawn('clip', [], { stdio: ['pipe', 'ignore', 'ignore'], shell: true });
    }
    if (proc) {
      proc.stdin.write(text);
      proc.stdin.end();
      return true;
    }
  } catch (e) {}
  return false;
}

function openChromeExtensions() {
  const platform = os.platform();
  return new Promise((resolve) => {
    let command;
    if (platform === 'darwin') {
      command = 'open -a "Google Chrome" "chrome://extensions"';
    } else if (platform === 'linux') {
      command = 'google-chrome "chrome://extensions" || chromium-browser "chrome://extensions"';
    } else if (platform === 'win32') {
      command = 'start chrome "chrome://extensions"';
    }

    if (command) {
      exec(command, (error) => {
        if (error) {
          console.log('\nCould not open Chrome automatically.');
          console.log('Please open Chrome and go to: chrome://extensions');
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function setup() {
  console.log('\nLeetCode Exporter Setup\n');

  if (!fs.existsSync(config.WORKSPACE_DIR)) {
    fs.mkdirSync(config.WORKSPACE_DIR, { recursive: true });
    console.log(`Created workspace: ${config.WORKSPACE_DIR}`);
  }

  const hostsDir = getNativeHostsDir();
  const manifestPath = path.join(hostsDir, `${config.HOST_NAME}.json`);
  const extensionPath = getExtensionPath();
  const nativeHostPath = getNativeHostPath();

  if (!fs.existsSync(hostsDir)) {
    fs.mkdirSync(hostsDir, { recursive: true });
  }

  try { fs.chmodSync(nativeHostPath, '755'); } catch (e) {}

  fs.writeFileSync(manifestPath, JSON.stringify(createManifest(), null, 2));
  console.log('Native messaging host registered');
  console.log(`  ${manifestPath}`);

  const copied = copyToClipboard(extensionPath);
  if (copied) {
    console.log('Extension path copied to clipboard');
  }

  console.log('\n' + '-'.repeat(50));
  console.log('\nTo complete setup:\n');
  console.log('1. Enable "Developer mode" (toggle in top-right)');
  console.log('2. Click "Load unpacked"');
  console.log(`3. ${copied ? 'Paste the path or navigate to:' : 'Navigate to:'}`);
  console.log(`   ${extensionPath}`);
  console.log('\n' + '-'.repeat(50));

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  await new Promise((resolve) => {
    rl.question('\nPress Enter to open Chrome extensions page...', async () => {
      rl.close();
      await openChromeExtensions();
      resolve();
    });
  });

  console.log('\nAfter loading the extension:');
  console.log('  1. Click the extension icon (puzzle piece) in Chrome toolbar');
  console.log('  2. Click "Copy Command" in the popup');
  console.log('  3. Paste and run the command in your terminal\n');
}

async function uninstall() {
  console.log('\nLeetCode Exporter Uninstall\n');

  const manifestPath = path.join(getNativeHostsDir(), `${config.HOST_NAME}.json`);

  if (fs.existsSync(manifestPath)) {
    fs.unlinkSync(manifestPath);
    console.log('Native messaging host unregistered');
    console.log(`  Removed: ${manifestPath}`);
  } else {
    console.log('Native messaging host was not registered');
  }

  console.log('\nTo complete uninstall:');
  console.log('1. Open chrome://extensions');
  console.log('2. Find "LeetCode to VS Code" and click Remove\n');
}

async function register(extensionId) {
  console.log('\nRegistering Extension ID\n');

  const cleanId = extensionId.trim().toLowerCase();
  if (!/^[a-z]{32}$/.test(cleanId)) {
    console.error('Invalid extension ID format');
    console.log('Extension IDs are 32 lowercase letters');
    console.log('Find your ID at chrome://extensions with Developer mode enabled');
    process.exit(1);
  }

  const manifestPath = path.join(getNativeHostsDir(), `${config.HOST_NAME}.json`);

  if (!fs.existsSync(manifestPath)) {
    console.error('Native messaging host not found. Run "leetcode-exporter setup" first.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.allowed_origins = [`chrome-extension://${cleanId}/`];
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('Extension ID registered');
  console.log(`  ID: ${cleanId}`);
  console.log(`  Manifest: ${manifestPath}\n`);
}

module.exports = { setup, uninstall, register };
