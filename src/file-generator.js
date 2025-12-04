const fs = require('fs');
const path = require('path');
const config = require('./config');

// Security limits
const MAX_CONTENT_SIZE = 100 * 1024; // 100KB max for code snippet
const MAX_FILENAME_LENGTH = 100;

function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return 'unknown';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_FILENAME_LENGTH) || 'unknown';
}

function sanitizeId(id) {
  if (!id) return '0';
  const cleaned = String(id).replace(/[^0-9]/g, '');
  return cleaned.slice(0, 10) || '0';
}

function getExtension(language) {
  const lang = language.toLowerCase();
  return config.LANGUAGE_EXTENSIONS[lang] || '.txt';
}

function getCommentStyle(language) {
  const lang = language.toLowerCase();
  return config.COMMENT_STYLES[lang] || { start: '/*', end: '*/', line: '//' };
}

function formatDescriptionComment(problem, language) {
  const style = getCommentStyle(language);
  const url = `https://leetcode.com/problems/${problem.titleSlug}/`;

  // Clean up HTML from description
  let description = problem.description || '';
  description = description
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

  // Wrap description to ~80 chars per line
  const wrapText = (text, maxLen = 76) => {
    const lines = [];
    const paragraphs = text.split(/\n\n+/);

    for (const para of paragraphs) {
      const words = para.replace(/\s+/g, ' ').trim().split(' ');
      let line = '';

      for (const word of words) {
        if (line.length + word.length + 1 > maxLen) {
          if (line) lines.push(line);
          line = word;
        } else {
          line = line ? `${line} ${word}` : word;
        }
      }
      if (line) lines.push(line);
      lines.push(''); // Empty line between paragraphs
    }

    return lines;
  };

  const descLines = wrapText(description);

  // Build comment block
  const lines = [
    style.start,
    ` * Problem: ${problem.title}`,
    ` * Difficulty: ${problem.difficulty}`,
    ` * URL: ${url}`,
    ` *`,
    ` * Description:`,
    ...descLines.map(l => ` * ${l}`),
    style.end,
    '',
  ];

  return lines.join('\n');
}

function generateFileContent(problem) {
  const language = problem.language || 'javascript';
  const comment = formatDescriptionComment(problem, language);
  const codeSnippet = problem.codeSnippet || '// Write your solution here\n';

  return comment + '\n' + codeSnippet;
}

function generateDirName(problem) {
  const id = sanitizeId(problem.id);
  const slug = sanitizeFilename(problem.titleSlug || problem.title || 'problem');
  return `${id}-${slug}`;
}

function generateFilename(problem) {
  const ext = getExtension(problem.language || 'javascript');
  return `solution${ext}`;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createProblemFile(problem) {
  const workspaceDir = path.resolve(config.WORKSPACE_DIR);

  if (problem.codeSnippet && problem.codeSnippet.length > MAX_CONTENT_SIZE) {
    problem.codeSnippet = problem.codeSnippet.slice(0, MAX_CONTENT_SIZE) + '\n// ... truncated';
  }

  const dirName = generateDirName(problem);
  const problemDir = path.join(workspaceDir, dirName);
  const resolvedDir = path.resolve(problemDir);

  if (!resolvedDir.startsWith(workspaceDir)) {
    throw new Error('Invalid path');
  }

  ensureDir(problemDir);

  const filename = generateFilename(problem);
  const filePath = path.join(problemDir, filename);
  const content = generateFileContent(problem);
  fs.writeFileSync(filePath, content, 'utf8');

  return filePath;
}

module.exports = {
  createProblemFile,
  generateFilename,
  generateFileContent,
  sanitizeFilename,
  getExtension,
};
