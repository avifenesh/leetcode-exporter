(function () {
  'use strict';

  if (window.__leetcodeExporterInjected) return;
  window.__leetcodeExporterInjected = true;

  const BUTTON_ID = 'leetcode-vscode-btn';

  function getProblemId() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
  }

  function extractProblemData() {
    const data = {
      id: '',
      title: '',
      titleSlug: getProblemId(),
      description: '',
      codeSnippet: '',
      language: 'javascript',
      difficulty: '',
      url: window.location.href
    };

    // Try multiple selectors for title (LeetCode changes their DOM frequently)
    const titleSelectors = [
      '[data-cy="question-title"]',
      '.text-title-large',
      'div[class*="title"] > a',
      'h4[class*="title"]',
      '[class*="question-title"]'
    ];

    for (const selector of titleSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        const titleText = el.textContent.trim();
        // Extract problem number and title (e.g., "1. Two Sum")
        const match = titleText.match(/^(\d+)\.\s*(.+)$/);
        if (match) {
          data.id = match[1];
          data.title = match[2];
        } else {
          data.title = titleText;
        }
        break;
      }
    }

    // Try to get problem ID from other sources if not in title
    if (!data.id) {
      // Look for it in the page's script tags (LeetCode stores data there)
      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const match = script.textContent?.match(/"questionFrontendId"\s*:\s*"(\d+)"/);
        if (match) {
          data.id = match[1];
          break;
        }
      }
    }

    // Extract difficulty
    const difficultySelectors = [
      '[class*="difficulty"]',
      '[diff]',
      '.text-difficulty-easy',
      '.text-difficulty-medium',
      '.text-difficulty-hard'
    ];

    for (const selector of difficultySelectors) {
      const el = document.querySelector(selector);
      if (el) {
        const text = el.textContent?.trim().toLowerCase();
        if (text?.includes('easy')) {
          data.difficulty = 'Easy';
          break;
        } else if (text?.includes('medium')) {
          data.difficulty = 'Medium';
          break;
        } else if (text?.includes('hard')) {
          data.difficulty = 'Hard';
          break;
        }
      }
    }

    // Extract description
    const descriptionSelectors = [
      '[data-track-load="description_content"]',
      '.elfjS', // LeetCode's description class
      '[class*="description"]',
      '.question-content'
    ];

    for (const selector of descriptionSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        data.description = el.textContent.trim();
        break;
      }
    }

    // Extract code snippet from Monaco editor FIRST (needed for language inference)
    // LeetCode uses Monaco editor, we need to get its content
    const monacoEditors = document.querySelectorAll('.monaco-editor');
    if (monacoEditors.length > 0) {
      // Try to get from Monaco's internal state
      const lines = document.querySelectorAll('.view-line');
      if (lines.length > 0) {
        data.codeSnippet = Array.from(lines)
          .map(line => line.textContent || '')
          .join('\n');
      }
    }

    // Fallback: try to get from textarea or code elements
    if (!data.codeSnippet) {
      const codeEl = document.querySelector('code, pre, textarea[name*="code"]');
      if (codeEl) {
        data.codeSnippet = codeEl.textContent || '';
      }
    }

    // Find language from button text (LeetCode shows language name in a button)
    const knownLanguages = {
      'c++': 'cpp', 'c#': 'csharp', 'javascript': 'javascript',
      'typescript': 'typescript', 'python': 'python', 'python3': 'python',
      'java': 'java', 'go': 'go', 'golang': 'go', 'rust': 'rust',
      'ruby': 'ruby', 'swift': 'swift', 'kotlin': 'kotlin', 'scala': 'scala',
      'php': 'php', 'c': 'c', 'dart': 'dart', 'racket': 'racket',
      'erlang': 'erlang', 'elixir': 'elixir', 'mysql': 'sql', 'mssql': 'sql',
      'oraclesql': 'sql', 'pythondata': 'python', 'postgresql': 'sql'
    };

    // Search all buttons for one containing a language name
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent?.trim().toLowerCase();
      if (text && knownLanguages[text]) {
        data.language = knownLanguages[text];
        break;
      }
    }

    return data;
  }

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 4px;">
        <path d="M14.5 1h-13a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5zM7 13H2V3h5v10zm7 0H8V8h6v5zm0-6H8V3h6v4z"/>
      </svg>
      Open in VS Code
    `;
    button.className = 'leetcode-vscode-button floating';
    button.title = 'Open this problem in VS Code';

    button.addEventListener('click', handleButtonClick);
    document.body.appendChild(button);
  }

  async function handleButtonClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = document.getElementById(BUTTON_ID);
    if (!button) return;

    const originalText = button.innerHTML;
    button.innerHTML = '⏳ Opening...';
    button.disabled = true;

    try {
      const problemData = extractProblemData();

      if (!problemData.title && !problemData.titleSlug) {
        throw new Error('Could not extract problem data. Please try refreshing the page.');
      }

      const response = await chrome.runtime.sendMessage({
        action: 'openProblem',
        data: problemData
      });

      if (response.success) {
        button.innerHTML = '✓ Opened!';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 2000);
      } else {
        const errorText = response.error || 'Failed to open in VS Code';
        const hint = response.hint || 'Make sure you have run "leetcode-exporter setup" in your terminal.';
        console.error('LeetCode to VS Code error:', errorText);
        button.innerHTML = '❌ Error';
        button.title = errorText;
        alert(`Failed to open in VS Code:\n\n${errorText}\n\n${hint}`);
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
          button.title = 'Open this problem in VS Code';
        }, 3000);
      }
    } catch (error) {
      console.error('LeetCode to VS Code error:', error);
      button.innerHTML = '❌ Error';
      button.title = error.message;
      alert(`Failed to open in VS Code:\n\n${error.message}\n\nMake sure you have run "leetcode-exporter setup" in your terminal.`);
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        button.title = 'Open this problem in VS Code';
      }, 3000);
    }
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(injectButton, 1000); // Give LeetCode time to render
      });
    } else {
      setTimeout(injectButton, 1000);
    }

    // Re-inject button on SPA navigation
    const observer = new MutationObserver(() => {
      if (!document.getElementById(BUTTON_ID)) {
        setTimeout(injectButton, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  init();
})();
