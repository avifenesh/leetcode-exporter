#!/usr/bin/env node

const { setup, uninstall, register } = require('./setup');

const command = process.argv[2];
const args = process.argv.slice(3);

const HELP = `
LeetCode Exporter - Open LeetCode problems in VS Code Insiders

Usage:
  leetcode-exporter <command> [options]

Commands:
  setup                Register native messaging host and open Chrome extensions page
  register <id>        Register specific Chrome extension ID (improves security)
  uninstall            Remove native messaging host registration

Examples:
  leetcode-exporter setup
  leetcode-exporter register abcdefghijklmnopqrstuvwxyz123456
  leetcode-exporter uninstall

After loading the extension, run 'register' with your extension ID from chrome://extensions
to restrict native messaging to only your extension (recommended for security).
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
