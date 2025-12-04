const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.leetcode-exporter.json');

const DEFAULTS = {
  workspaceDir: path.join(os.homedir(), 'leetcode'),
  editor: 'auto'
};

function load() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return { ...DEFAULTS, ...data };
    }
  } catch (e) {}
  return { ...DEFAULTS };
}

function save(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function get(key) {
  const config = load();
  return config[key];
}

function set(key, value) {
  const config = load();
  config[key] = value;
  save(config);
}

module.exports = { load, save, get, set, CONFIG_FILE, DEFAULTS };
