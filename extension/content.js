(function () {
  'use strict';

  if (window.__leetcodeExporterInjected) return;
  window.__leetcodeExporterInjected = true;

  const BUTTON_ID = 'leetcode-vscode-btn';
  const TEST_BUTTON_ID = 'leetcode-test-btn';
  const SUBMIT_BUTTON_ID = 'leetcode-submit-btn';

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
        data.testCases = extractTestCases(data.description);
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

  function getQuestionId() {
    // Try to get numeric question ID from page scripts
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const match = script.textContent?.match(/"questionId"\s*:\s*"(\d+)"/);
      if (match) return match[1];
    }
    // Fallback to frontend ID
    for (const script of scripts) {
      const match = script.textContent?.match(/"questionFrontendId"\s*:\s*"(\d+)"/);
      if (match) return match[1];
    }
    return null;
  }

  function getCurrentCode() {
    // Get code from Monaco editor
    const lines = document.querySelectorAll('.view-line');
    if (lines.length > 0) {
      return Array.from(lines).map(line => line.textContent || '').join('\n');
    }
    return null;
  }

  function getCurrentLanguage() {
    const langMap = {
      'c++': 'cpp', 'c#': 'csharp', 'javascript': 'javascript',
      'typescript': 'typescript', 'python': 'python', 'python3': 'python3',
      'java': 'java', 'go': 'golang', 'rust': 'rust', 'ruby': 'ruby',
      'swift': 'swift', 'kotlin': 'kotlin', 'scala': 'scala', 'php': 'php',
      'c': 'c', 'dart': 'dart', 'racket': 'racket', 'erlang': 'erlang',
      'elixir': 'elixir'
    };

    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent?.trim().toLowerCase();
      if (text && langMap[text]) {
        return langMap[text];
      }
    }
    return 'python3';
  }

  function getDefaultTestCases() {
    // Get test cases from the testcase input area
    const testcaseArea = document.querySelector('[data-cy="testcase-input"]') ||
                         document.querySelector('textarea[name="testcase"]') ||
                         document.querySelector('.testcase-input');
    if (testcaseArea) {
      return testcaseArea.value || testcaseArea.textContent;
    }

    // Fallback: extract from examples
    const data = extractProblemData();
    if (data.testCases.length > 0) {
      return data.testCases.map(tc => tc.input).join('\n');
    }
    return '';
  }

  function showResultModal(result, isSubmit) {
    // Remove existing modal
    const existing = document.getElementById('leetcode-result-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'leetcode-result-modal';
    modal.className = 'leetcode-result-modal';

    const statusClass = result.success ? 'success' : 'error';
    const statusIcon = result.success ? '✓' : '✗';

    let content = `
      <div class="modal-header ${statusClass}">
        <span class="status-icon">${statusIcon}</span>
        <span class="status-text">${result.status}</span>
        <button class="close-btn" onclick="this.closest('.leetcode-result-modal').remove()">×</button>
      </div>
      <div class="modal-body">
    `;

    if (result.runtime) {
      content += `<div class="stat"><span>Runtime:</span> ${result.runtime}`;
      if (result.runtimePercentile) {
        content += ` (faster than ${result.runtimePercentile.toFixed(1)}%)`;
      }
      content += `</div>`;
    }

    if (result.memory) {
      content += `<div class="stat"><span>Memory:</span> ${result.memory}`;
      if (result.memoryPercentile) {
        content += ` (less than ${result.memoryPercentile.toFixed(1)}%)`;
      }
      content += `</div>`;
    }

    if (result.compileError) {
      content += `<div class="error-box"><strong>Compile Error:</strong><pre>${result.compileError}</pre></div>`;
    }

    if (result.runtimeError) {
      content += `<div class="error-box"><strong>Runtime Error:</strong><pre>${result.runtimeError}</pre></div>`;
    }

    if (result.failedTest) {
      content += `
        <div class="failed-test">
          <div><strong>Input:</strong><pre>${result.failedTest.input}</pre></div>
          <div><strong>Expected:</strong><pre>${result.failedTest.expected}</pre></div>
          <div><strong>Output:</strong><pre>${result.failedTest.actual}</pre></div>
        </div>
      `;
    }

    content += `</div>`;
    modal.innerHTML = content;
    document.body.appendChild(modal);

    // Auto-close after 10 seconds for success
    if (result.success) {
      setTimeout(() => modal.remove(), 10000);
    }
  }

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;

    // Create container for all buttons
    const container = document.createElement('div');
    container.id = 'leetcode-exporter-container';
    container.className = 'leetcode-exporter-container';

    // Open in VS Code button
    const openBtn = document.createElement('button');
    openBtn.id = BUTTON_ID;
    openBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 1h-13a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5zM7 13H2V3h5v10zm7 0H8V8h6v5zm0-6H8V3h6v4z"/></svg> Open`;
    openBtn.className = 'leetcode-exporter-btn open-btn';
    openBtn.title = 'Open in VS Code';
    openBtn.addEventListener('click', handleButtonClick);

    // Test button
    const testBtn = document.createElement('button');
    testBtn.id = TEST_BUTTON_ID;
    testBtn.innerHTML = '▶ Test';
    testBtn.className = 'leetcode-exporter-btn test-btn';
    testBtn.title = 'Run test cases';
    testBtn.addEventListener('click', handleTestClick);

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.id = SUBMIT_BUTTON_ID;
    submitBtn.innerHTML = '⬆ Submit';
    submitBtn.className = 'leetcode-exporter-btn submit-btn';
    submitBtn.title = 'Submit solution';
    submitBtn.addEventListener('click', handleSubmitClick);

    container.appendChild(openBtn);
    container.appendChild(testBtn);
    container.appendChild(submitBtn);
    document.body.appendChild(container);
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

  async function handleTestClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = document.getElementById(TEST_BUTTON_ID);
    if (!button) return;

    const originalText = button.innerHTML;
    button.innerHTML = '⏳ Testing...';
    button.disabled = true;

    try {
      const slug = getProblemSlug();
      const questionId = getQuestionId();
      const code = getCurrentCode();
      const language = getCurrentLanguage();
      const testCases = getDefaultTestCases();

      if (!slug || !questionId || !code) {
        throw new Error('Could not extract problem data. Please refresh the page.');
      }

      const response = await chrome.runtime.sendMessage({
        action: 'testSolution',
        data: { slug, questionId, code, language, testCases }
      });

      if (response.success) {
        showResultModal(response.result, false);
        button.innerHTML = response.result.success ? '✓ Passed' : '✗ Failed';
      } else {
        throw new Error(response.error || 'Test failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      alert(`Test failed: ${error.message}`);
      button.innerHTML = '✗ Error';
    } finally {
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
      }, 3000);
    }
  }

  async function handleSubmitClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = document.getElementById(SUBMIT_BUTTON_ID);
    if (!button) return;

    const originalText = button.innerHTML;
    button.innerHTML = '⏳ Submitting...';
    button.disabled = true;

    try {
      const slug = getProblemSlug();
      const questionId = getQuestionId();
      const code = getCurrentCode();
      const language = getCurrentLanguage();

      if (!slug || !questionId || !code) {
        throw new Error('Could not extract problem data. Please refresh the page.');
      }

      const response = await chrome.runtime.sendMessage({
        action: 'submitSolution',
        data: { slug, questionId, code, language }
      });

      if (response.success) {
        showResultModal(response.result, true);
        button.innerHTML = response.result.success ? '✓ Accepted' : '✗ Failed';
      } else {
        throw new Error(response.error || 'Submit failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert(`Submit failed: ${error.message}`);
      button.innerHTML = '✗ Error';
    } finally {
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
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
