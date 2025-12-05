# LeetCode Exporter

[![npm](https://img.shields.io/npm/v/leetcode-exporter)](https://www.npmjs.com/package/leetcode-exporter)

Open LeetCode problems in your editor and test/submit solutions from the command line.

## Quick Start

```bash
npm install -g leetcode-exporter
leetcode-exporter setup
```

Then load the Chrome extension and register it (see [Installation](#installation) for details).

## Features

- **One-Click Export**: Click extension icon on any LeetCode problem to open it in your editor
- **CLI Test & Submit**: Run tests and submit solutions without leaving your terminal
- **No Browser Required**: After opening a problem, work entirely from your editor
- **Multiple Languages**: JavaScript, TypeScript, Python, Java, C++, C, Go, Rust, and more

## Installation

### Prerequisites

- Node.js 14 or higher
- Google Chrome browser
- One of: Cursor, VS Code Insiders, or VS Code

### Step 1: Install the CLI Tool

```bash
npm install -g leetcode-exporter
```

### Step 2: Run Setup

```bash
leetcode-exporter setup
```

This will register the native host and open Chrome's extensions page.

### Step 3: Load the Extension

1. In Chrome, enable **Developer mode** (toggle in top-right)
2. Click **Load unpacked**
3. Paste the path from clipboard (or navigate to the extension folder)

### Step 4: Register Extension

1. Click the **extension icon** in Chrome toolbar
2. Click **"Copy Command"**
3. Paste and run in terminal

## Usage

### Opening Problems

1. Go to any LeetCode problem (e.g., https://leetcode.com/problems/two-sum/)
2. Click the **extension icon** → **"Open in Editor"**
3. The problem opens in your editor with the code template and description

### Testing Solutions

```bash
# Test solution in current directory
leetcode-exporter test

# Test specific problem
leetcode-exporter test ./1-two-sum
```

### Submitting Solutions

```bash
# Submit solution in current directory
leetcode-exporter submit

# Submit specific problem
leetcode-exporter submit ./1-two-sum
```

Example output:
```
Submitting: /Users/you/leetcode/1-two-sum/solution.py

Problem: two-sum (#1)
Language: python3

Submitting...

✓ Accepted
  Runtime: 52 ms (faster than 85.2%)
  Memory: 15.1 MB (less than 62.3%)
  Tests: 63/63 passed
```

## Configuration

```bash
# View current config
leetcode-exporter config

# Change workspace directory
leetcode-exporter config workspaceDir ~/projects/leetcode

# Set preferred editor (auto, cursor, code-insiders, code)
leetcode-exporter config editor cursor

# Enable visual button on LeetCode pages (optional)
leetcode-exporter config showVisualButton true
```

## File Output

Files are saved to `~/leetcode/` in organized directories:

```
~/leetcode/
├── 1-two-sum/
│   └── solution.js
├── 2-add-two-numbers/
│   └── solution.py
└── 3-longest-substring-without-repeating-characters/
    └── solution.rs
```

Example file content:

```javascript
/*
 * Problem: Two Sum
 * Difficulty: Easy
 * URL: https://leetcode.com/problems/two-sum/
 *
 * Description:
 * Given an array of integers nums and an integer target, return indices
 * of the two numbers such that they add up to target...
 */

function twoSum(nums, target) {
  // Your solution here
}
```

## Supported Languages

| Language | Extension |
|----------|-----------|
| JavaScript | .js |
| TypeScript | .ts |
| Python | .py |
| Java | .java |
| C++ | .cpp |
| C | .c |
| Go | .go |
| Rust | .rs |
| Ruby | .rb |
| Swift | .swift |
| Kotlin | .kt |

## Uninstall

```bash
leetcode-exporter uninstall
```

Then remove the extension from Chrome.

## Troubleshooting

### "Not logged in" error when testing/submitting

1. Make sure you're logged in to LeetCode in Chrome
2. Visit any LeetCode problem page (this syncs your session to the CLI)
3. Try the command again

### "No editor found" error

1. Make sure you have VS Code, VS Code Insiders, or Cursor installed
2. Ensure your editor's CLI is in PATH:
   ```bash
   which code    # or code-insiders, or cursor
   ```
3. Or set your preferred editor: `leetcode-exporter config editor cursor`

### Extension icon doesn't open problem

- Make sure you're on a LeetCode problem page (e.g., /problems/two-sum/)
- Try refreshing the page
- Check that the extension is enabled in `chrome://extensions`

### Native host errors

Re-run the setup:
```bash
leetcode-exporter setup
```

## Security & Privacy

- **Session-based auth**: Uses your existing LeetCode browser session for API calls
- **Local storage**: Session tokens are stored locally in `~/.leetcode-exporter.json`
- **No external servers**: All communication is between your browser, CLI, and LeetCode
- **Minimal permissions**: Only accesses leetcode.com pages

## Legal Notice

This tool is for personal educational use only. LeetCode problem descriptions are the property of LeetCode. Do not use this tool to redistribute or publish problem content.

## License

MIT
