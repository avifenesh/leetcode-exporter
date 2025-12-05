#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
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
  test [file]          Test solution against LeetCode (default: current dir)
  submit [file]        Submit solution to LeetCode (default: current dir)
  config [key] [val]   View or set configuration
  uninstall            Remove native messaging host registration

Examples:
  leetcode-exporter setup
  leetcode-exporter test                     # test solution in current problem dir
  leetcode-exporter test ./1-two-sum        # test specific problem
  leetcode-exporter submit
  leetcode-exporter config
`;

const LANG_MAP = {
  '.js': 'javascript', '.ts': 'typescript', '.py': 'python3',
  '.java': 'java', '.cpp': 'cpp', '.c': 'c', '.go': 'golang',
  '.rs': 'rust', '.rb': 'ruby', '.swift': 'swift', '.kt': 'kotlin'
};

function findSolutionFile(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.startsWith('solution')) return path.join(dir, file);
  }
  throw new Error('No solution file found');
}

function parseInputLine(inputLine) {
  // Parse "nums = [2,7,11,15], target = 9" into ["[2,7,11,15]", "9"]
  // Handle arrays, strings, and numbers properly
  const values = [];
  let remaining = inputLine.trim();

  // Remove trailing "Output:" or "Explanation:" parts
  remaining = remaining.replace(/\s+Output:.*$/i, '').replace(/\s+Explanation:.*$/i, '');

  while (remaining.length > 0) {
    // Match: varname = value
    const varMatch = remaining.match(/^(\w+)\s*=\s*/);
    if (!varMatch) break;

    remaining = remaining.slice(varMatch[0].length);

    // Extract value - could be array, string, or number
    let value = '';
    if (remaining.startsWith('[')) {
      // Array - find matching bracket
      let depth = 0;
      let i = 0;
      for (; i < remaining.length; i++) {
        if (remaining[i] === '[') depth++;
        else if (remaining[i] === ']') depth--;
        if (depth === 0) { i++; break; }
      }
      value = remaining.slice(0, i);
      remaining = remaining.slice(i);
    } else if (remaining.startsWith('"')) {
      // String - find closing quote
      const endQuote = remaining.indexOf('"', 1);
      value = remaining.slice(0, endQuote + 1);
      remaining = remaining.slice(endQuote + 1);
    } else {
      // Number or other - read until comma or space before next var
      const nextVar = remaining.search(/,\s*\w+\s*=/);
      if (nextVar === -1) {
        value = remaining.trim();
        remaining = '';
      } else {
        value = remaining.slice(0, nextVar).trim();
        remaining = remaining.slice(nextVar + 1);
      }
    }

    values.push(value);

    // Skip comma/whitespace between variables
    remaining = remaining.replace(/^[,\s]+/, '');
  }

  return values;
}

function extractTestCases(content) {
  // Try to find "Test Cases:" section first
  const testSection = content.match(/Test Cases:[\s\S]*?(?=\n\n|\*\/|$)/i);
  if (testSection) {
    const inputMatches = testSection[0].matchAll(/Input:\s*([^\n]+)/gi);
    for (const match of inputMatches) {
      const values = parseInputLine(match[1]);
      if (values.length > 0) return values.join('\n');
    }
  }

  // Fall back to examples in description
  const exampleMatch = content.match(/Example\s*1:[\s\S]*?Input:\s*([^\n]+)/i);
  if (exampleMatch) {
    const values = parseInputLine(exampleMatch[1]);
    if (values.length > 0) return values.join('\n');
  }

  return '';
}

function extractProblemInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  const dirName = path.basename(dir);

  // Extract slug from directory name (e.g., "1-two-sum" -> "two-sum")
  const slugMatch = dirName.match(/^\d+-(.+)$/);
  const slug = slugMatch ? slugMatch[1] : dirName;

  // Extract question ID from file comments or directory name
  const idMatch = dirName.match(/^(\d+)-/);
  const questionId = idMatch ? idMatch[1] : null;

  // Get language from extension
  const ext = path.extname(filePath);
  const language = LANG_MAP[ext] || 'python3';

  // Extract test cases
  const testCases = extractTestCases(content);

  return { slug, questionId, language, code: content, testCases };
}

async function runTestOrSubmit(cmd, target) {
  const leetcodeApi = require('./leetcode-api');

  // Find solution file
  let filePath;
  if (target) {
    const stat = fs.statSync(target);
    filePath = stat.isDirectory() ? findSolutionFile(target) : target;
  } else {
    filePath = findSolutionFile(process.cwd());
  }

  console.log(`\n${cmd === 'test' ? 'Testing' : 'Submitting'}: ${filePath}\n`);

  const info = extractProblemInfo(filePath);
  if (!info.questionId) {
    throw new Error('Could not determine problem ID. Check directory name format (e.g., 1-two-sum)');
  }

  console.log(`Problem: ${info.slug} (#${info.questionId})`);
  console.log(`Language: ${info.language}\n`);

  let result;
  if (cmd === 'test') {
    if (!info.testCases) {
      throw new Error('No test cases found. Add test cases to the file or use LeetCode web.');
    }
    console.log('Running tests...');
    result = await leetcodeApi.testSolution(info.slug, info.questionId, info.code, info.language, info.testCases);
  } else {
    console.log('Submitting...');
    result = await leetcodeApi.submitSolution(info.slug, info.questionId, info.code, info.language);
  }

  // Display result
  const icon = result.success ? '✓' : '✗';
  const color = result.success ? '\x1b[32m' : '\x1b[31m';
  console.log(`\n${color}${icon} ${result.status}\x1b[0m`);

  if (result.runtime) console.log(`  Runtime: ${result.runtime}${result.runtimePercentile ? ` (faster than ${result.runtimePercentile.toFixed(1)}%)` : ''}`);
  if (result.memory) console.log(`  Memory: ${result.memory}${result.memoryPercentile ? ` (less than ${result.memoryPercentile.toFixed(1)}%)` : ''}`);
  if (result.passedTests !== undefined) console.log(`  Tests: ${result.passedTests}/${result.totalTests} passed`);
  if (result.compileError) console.log(`\n  Compile Error:\n  ${result.compileError}`);
  if (result.runtimeError) console.log(`\n  Runtime Error:\n  ${result.runtimeError}`);
  if (result.failedInput) {
    console.log(`\n  Failed Test:`);
    console.log(`    Input: ${result.failedInput}`);
    console.log(`    Expected: ${result.expected}`);
    console.log(`    Got: ${result.actual}`);
  }
  console.log('');

  if (!result.success) process.exit(1);
}

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
    case 'test':
    case 'submit':
      await runTestOrSubmit(command, args[0]);
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
