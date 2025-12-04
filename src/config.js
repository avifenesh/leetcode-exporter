const os = require('os');
const path = require('path');

const config = {
  // Where to save LeetCode problem files
  WORKSPACE_DIR: path.join(os.homedir(), 'leetcode'),

  // Native messaging host name
  HOST_NAME: 'com.leetcode.exporter',

  // Language to file extension mapping
  LANGUAGE_EXTENSIONS: {
    'javascript': '.js',
    'typescript': '.ts',
    'python': '.py',
    'python3': '.py',
    'java': '.java',
    'c': '.c',
    'cpp': '.cpp',
    'c++': '.cpp',
    'go': '.go',
    'rust': '.rs',
    'ruby': '.rb',
    'swift': '.swift',
    'kotlin': '.kt',
    'scala': '.scala',
    'php': '.php',
    'csharp': '.cs',
    'c#': '.cs',
    'dart': '.dart',
    'racket': '.rkt',
    'erlang': '.erl',
    'elixir': '.ex',
  },

  // Comment styles by language
  COMMENT_STYLES: {
    'javascript': { start: '/*', end: '*/', line: '//' },
    'typescript': { start: '/*', end: '*/', line: '//' },
    'python': { start: '"""', end: '"""', line: '#' },
    'python3': { start: '"""', end: '"""', line: '#' },
    'java': { start: '/*', end: '*/', line: '//' },
    'c': { start: '/*', end: '*/', line: '//' },
    'cpp': { start: '/*', end: '*/', line: '//' },
    'c++': { start: '/*', end: '*/', line: '//' },
    'go': { start: '/*', end: '*/', line: '//' },
    'rust': { start: '/*', end: '*/', line: '//' },
    'ruby': { start: '=begin', end: '=end', line: '#' },
    'swift': { start: '/*', end: '*/', line: '//' },
    'kotlin': { start: '/*', end: '*/', line: '//' },
    'scala': { start: '/*', end: '*/', line: '//' },
    'php': { start: '/*', end: '*/', line: '//' },
    'csharp': { start: '/*', end: '*/', line: '//' },
    'c#': { start: '/*', end: '*/', line: '//' },
    'dart': { start: '/*', end: '*/', line: '//' },
    'racket': { start: '#|', end: '|#', line: ';' },
    'erlang': { start: '%%', end: '%%', line: '%' },
    'elixir': { start: '@moduledoc """', end: '"""', line: '#' },
  }
};

module.exports = config;
