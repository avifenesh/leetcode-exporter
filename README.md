# LeetCode Exporter

[![npm](https://img.shields.io/npm/v/leetcode-exporter)](https://www.npmjs.com/package/leetcode-exporter)

Open LeetCode problems directly in VS Code, VS Code Insiders, or Cursor with a single click.

## Quick Start

```bash
npm install -g leetcode-exporter
leetcode-exporter setup
```

Then load the Chrome extension and register it (see [Installation](#installation) for details).

## Features

- **Seamless Experience**: Click a button on any LeetCode problem page to open it in your editor
- **No Authentication Required**: Uses your existing browser session (no need to enter credentials)
- **Problem Description Included**: Generated file includes problem description as comments
- **Multiple Languages**: Supports JavaScript, TypeScript, Python, Java, C++, Go, Rust, and more

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

### Step 4: Complete Setup

1. Click the **extension icon** in Chrome toolbar (puzzle piece icon)
2. Click **"Copy Command"** in the popup
3. Paste and run in terminal

## Usage

1. Go to any LeetCode problem in Chrome (e.g., https://leetcode.com/problems/two-sum/)
2. Click the **"Open in VS Code"** button
3. The problem opens in your editor with the code template and description

## Configuration

Configure with `leetcode-exporter config`:

```bash
# View current config
leetcode-exporter config

# Change workspace directory
leetcode-exporter config workspaceDir ~/projects/leetcode

# Set preferred editor (auto, cursor, code-insiders, code)
leetcode-exporter config editor cursor
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
| Python/Python3 | .py |
| Java | .java |
| C++ | .cpp |
| C | .c |
| Go | .go |
| Rust | .rs |
| Ruby | .rb |
| Swift | .swift |
| Kotlin | .kt |
| C# | .cs |

## Uninstall

```bash
leetcode-exporter uninstall
```

Then remove the extension from Chrome.

## Troubleshooting

### "No editor found" error

1. Make sure you have VS Code, VS Code Insiders, or Cursor installed
2. Ensure your editor's CLI is in PATH:
   ```bash
   which code    # or code-insiders, or cursor
   ```
3. Or set your preferred editor: `leetcode-exporter config editor cursor`

### Button not appearing on LeetCode

- Try refreshing the page
- Make sure the extension is enabled in `chrome://extensions`
- Check the browser console for errors

### Native host errors

Re-run the setup:
```bash
leetcode-exporter setup
```

## Security & Privacy

- **No credentials stored**: The extension only reads problem content from the page
- **No external network calls**: All data stays local on your machine
- **Minimal permissions**: Only accesses leetcode.com pages

## Legal Notice

This tool is for personal educational use only. LeetCode problem descriptions are the property of LeetCode. Do not use this tool to redistribute or publish problem content.

## License

MIT
