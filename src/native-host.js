#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createProblemFile } = require('./file-generator');

const DEBUG = process.env.LEETCODE_EXPORTER_DEBUG !== '0';
const LOG_FILE = path.join(os.homedir(), 'leetcode-exporter-debug.log');
const MAX_LOG_SIZE = 1024 * 1024;

function log(msg) {
  if (!DEBUG) return;
  try {
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_LOG_SIZE) {
      fs.renameSync(LOG_FILE, LOG_FILE + '.old');
    }
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {}
}

function writeMessage(msg, exitCode = null) {
  const json = JSON.stringify(msg);
  const buf = Buffer.from(json, 'utf8');
  const len = Buffer.alloc(4);
  len.writeUInt32LE(buf.length, 0);
  process.stdout.write(len);
  process.stdout.write(buf, () => {
    if (exitCode !== null) process.exit(exitCode);
  });
}

function openInVSCode(filePath) {
  return new Promise((resolve, reject) => {
    const commands = [
      ['code-insiders', [filePath]],
      ['code', [filePath]],
      ['open', ['-a', 'Visual Studio Code - Insiders', filePath]],
      ['open', ['-a', 'Visual Studio Code', filePath]],
    ];

    function tryCommand(index) {
      if (index >= commands.length) {
        reject(new Error('Failed to open VS Code'));
        return;
      }
      const [cmd, args] = commands[index];
      const proc = spawn(cmd, args, { stdio: 'ignore' });

      proc.on('error', () => tryCommand(index + 1));
      proc.on('close', (code) => {
        if (code === 0) {
          log('Opened with: ' + cmd);
          resolve();
        } else {
          tryCommand(index + 1);
        }
      });
    }

    tryCommand(0);
  });
}

let buffer = Buffer.alloc(0);
let messageLength = null;
let processed = false;

process.stdin.on('readable', () => {
  let chunk;
  while ((chunk = process.stdin.read()) !== null) {
    buffer = Buffer.concat([buffer, chunk]);
  }

  if (!processed && buffer.length >= 4) {
    if (messageLength === null) {
      messageLength = buffer.readUInt32LE(0);
    }

    if (buffer.length >= 4 + messageLength) {
      processed = true;
      const msgBuf = buffer.slice(4, 4 + messageLength);
      try {
        handleMessage(JSON.parse(msgBuf.toString('utf8')));
      } catch (e) {
        log('Parse error: ' + e.message);
        writeMessage({ success: false, error: 'Invalid JSON' }, 1);
      }
    }
  }
});

async function handleMessage(message) {
  try {
    if (message.action === 'openProblem' && message.data) {
      const problem = message.data;
      log('Processing: ' + problem.title);

      const filePath = createProblemFile(problem);
      log('Created: ' + filePath);

      await openInVSCode(filePath);
      writeMessage({ success: true, filePath }, 0);
    } else {
      writeMessage({ success: false, error: 'Invalid action' }, 0);
    }
  } catch (e) {
    log('Error: ' + e.message);
    writeMessage({ success: false, error: e.message }, 0);
  }
}

setTimeout(() => {
  writeMessage({ success: false, error: 'Timeout' }, 1);
}, 10000);
