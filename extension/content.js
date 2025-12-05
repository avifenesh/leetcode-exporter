(function () {
  'use strict';

  if (window.__leetcodeExporterInjected) return;
  window.__leetcodeExporterInjected = true;

  const BUTTON_ID = 'leetcode-vscode-btn';

  function getProblemSlug() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
  }

  function extractTestCases(description) {
    if (!description) return [];

    const testCases = [];
    const exampleRegex = /Example\s*(\d*):\s*([\s\S]*?)(?=Example\s*\d*:|Constraints:|Follow-up:|Note:|$)/gi;
    let match;

    while ((match = exampleRegex.exec(description)) !== null) {
      const exampleText = match[2].trim();
      const testCase = { input: '', output: '', explanation: '' };

      const inputMatch = exampleText.match(/Input:\s*([\s\S]*?)(?=Output:|$)/i);
      if (inputMatch) testCase.input = inputMatch[1].trim();

      const outputMatch = exampleText.match(/Output:\s*([\s\S]*?)(?=Explanation:|$)/i);
      if (outputMatch) testCase.output = outputMatch[1].trim();

      const explanationMatch = exampleText.match(/Explanation:\s*([\s\S]*?)$/i);
      if (explanationMatch) testCase.explanation = explanationMatch[1].trim();

      if (testCase.input || testCase.output) {
        testCases.push(testCase);
      }
    }

    return testCases;
  }

  function extractProblemData() {
    const data = {
      id: '',
      title: '',
      titleSlug: getProblemSlug(),
      description: '',
      testCases: [],
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
      '.elfjS',
      '[class*="description"]',
      '.question-content'
    ];

    for (const selector of descriptionSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        data.description = el.textContent.trim();
        data.testCases = extractTestCases(data.description);
        break;
      }
    }

    // Extract code snippet from Monaco editor
    const monacoEditors = document.querySelectorAll('.monaco-editor');
    if (monacoEditors.length > 0) {
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

    // Find language from button text
    const knownLanguages = {
      'c++': 'cpp', 'c#': 'csharp', 'javascript': 'javascript',
      'typescript': 'typescript', 'python': 'python', 'python3': 'python',
      'java': 'java', 'go': 'go', 'golang': 'go', 'rust': 'rust',
      'ruby': 'ruby', 'swift': 'swift', 'kotlin': 'kotlin', 'scala': 'scala',
      'php': 'php', 'c': 'c', 'dart': 'dart', 'racket': 'racket',
      'erlang': 'erlang', 'elixir': 'elixir', 'mysql': 'sql', 'mssql': 'sql',
      'oraclesql': 'sql', 'pythondata': 'python', 'postgresql': 'sql'
    };

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

  // Listen for messages from background script (for extension icon click)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getProblemData') {
      const data = extractProblemData();
      sendResponse({ success: true, data });
    }
    return true;
  });

  async function openInEditor() {
    const button = document.getElementById(BUTTON_ID);
    const originalText = button?.innerHTML;

    if (button) {
      button.innerHTML = '⏳ Opening...';
      button.disabled = true;
    }

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
        if (button) {
          button.innerHTML = '✓ Opened!';
          setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
          }, 2000);
        }
      } else {
        throw new Error(response.error || 'Failed to open in editor');
      }
    } catch (error) {
      console.error('LeetCode Exporter error:', error);
      if (button) {
        button.innerHTML = '❌ Error';
        button.title = error.message;
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
          button.title = 'Open in editor';
        }, 3000);
      }
      alert(`Failed to open in editor:\n\n${error.message}\n\nMake sure you have run "leetcode-exporter setup" in your terminal.`);
    }
  }

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 1h-13a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5zM7 13H2V3h5v10zm7 0H8V8h6v5zm0-6H8V3h6v4z"/></svg> Open`;
    button.className = 'leetcode-vscode-button floating';
    button.title = 'Open in editor';
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openInEditor();
    });
    document.body.appendChild(button);
  }

  async function init() {
    // Check if visual button is enabled (default: false)
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      if (response.success && response.config?.showVisualButton) {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => setTimeout(injectButton, 1000));
        } else {
          setTimeout(injectButton, 1000);
        }

        // Re-inject button on SPA navigation
        const observer = new MutationObserver(() => {
          if (!document.getElementById(BUTTON_ID)) {
            setTimeout(injectButton, 500);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    } catch (e) {
      // Extension not ready, skip visual button
    }
  }

  init();
})();
