#!/usr/bin/env node

const { setup, uninstall, register } = require('./setup');
const userConfig = require('./user-config');

const command = process.argv[2];
const args = process.argv.slice(3);

const HELP = `
LeetCode Exporter - Open LeetCode problems in your editor

Usage:
  leetcode-exporter <command> [options]

Commands:
  setup                Register native messaging host and open Chrome extensions page
  register <id>        Register specific Chrome extension ID (improves security)
  config [key] [val]   View or set configuration
  uninstall            Remove native messaging host registration

Configuration keys:
  workspaceDir         Directory to save problem files (default: ~/leetcode)
  editor               Preferred editor: auto, cursor, code-insiders, code (default: auto)

Examples:
  leetcode-exporter setup
  leetcode-exporter register abcdefghijklmnopqrstuvwxyz123456
  leetcode-exporter config workspaceDir ~/projects/leetcode
  leetcode-exporter config
  leetcode-exporter uninstall
`;

async function main() {
  switch (command) {
    case 'setup':
      await setup();
      break;
    case 'register':
      if (!args[0]) {
        console.error('Error: Extension ID required');
        console.log('Usage: leetcode-exporter register <extension-id>');
        console.log('\nFind your extension ID at chrome://extensions (enable Developer mode)');
        process.exit(1);
      }
      await register(args[0]);
      break;
    case 'config':
      if (!args[0]) {
        const config = userConfig.load();
        console.log('\nCurrent configuration:\n');
        console.log(`  workspaceDir: ${config.workspaceDir}`);
        console.log(`  editor:       ${config.editor}`);
        console.log(`\nConfig file: ${userConfig.CONFIG_FILE}\n`);
      } else if (!args[1]) {
        console.log(userConfig.get(args[0]));
      } else {
        userConfig.set(args[0], args[1]);
        console.log(`Set ${args[0]} = ${args[1]}`);
      }
      break;
    case 'uninstall':
      await uninstall();
      break;
    case '--help':
    case '-h':
    case undefined:
      console.log(HELP);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
