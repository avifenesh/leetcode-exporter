#!/usr/bin/env node
// Generate extension icons

const fs = require('fs');
const path = require('path');

// Simple PNG generator for a "LC" code icon
// Using minimal PNG structure with raw pixel data

function createIcon(size) {
  const canvas = [];

  // Colors
  const bg = [0, 122, 204]; // VS Code blue
  const fg = [255, 255, 255]; // White

  // Initialize with background
  for (let y = 0; y < size; y++) {
    canvas[y] = [];
    for (let x = 0; x < size; x++) {
      canvas[y][x] = bg;
    }
  }

  // Draw "{ }" brackets symbol
  const margin = Math.floor(size * 0.15);
  const thickness = Math.max(2, Math.floor(size * 0.12));
  const bracketWidth = Math.floor(size * 0.25);

  // Left bracket {
  const leftX = margin;
  const midY = Math.floor(size / 2);
  const armLength = Math.floor(size * 0.3);

  // Top arm of {
  for (let i = 0; i < armLength; i++) {
    for (let t = 0; t < thickness; t++) {
      const y = margin + i;
      const x = leftX + bracketWidth - Math.floor(i * bracketWidth / armLength) + t;
      if (y < size && x < size) canvas[y][x] = fg;
    }
  }

  // Bottom arm of {
  for (let i = 0; i < armLength; i++) {
    for (let t = 0; t < thickness; t++) {
      const y = size - margin - i - 1;
      const x = leftX + bracketWidth - Math.floor(i * bracketWidth / armLength) + t;
      if (y >= 0 && x < size) canvas[y][x] = fg;
    }
  }

  // Middle point of {
  for (let t = 0; t < thickness + 1; t++) {
    for (let ty = -1; ty <= 1; ty++) {
      if (midY + ty >= 0 && midY + ty < size && leftX + t < size) {
        canvas[midY + ty][leftX + t] = fg;
      }
    }
  }

  // Right bracket }
  const rightX = size - margin - thickness;

  // Top arm of }
  for (let i = 0; i < armLength; i++) {
    for (let t = 0; t < thickness; t++) {
      const y = margin + i;
      const x = rightX - bracketWidth + Math.floor(i * bracketWidth / armLength) + t;
      if (y < size && x >= 0 && x < size) canvas[y][x] = fg;
    }
  }

  // Bottom arm of }
  for (let i = 0; i < armLength; i++) {
    for (let t = 0; t < thickness; t++) {
      const y = size - margin - i - 1;
      const x = rightX - bracketWidth + Math.floor(i * bracketWidth / armLength) + t;
      if (y >= 0 && x >= 0 && x < size) canvas[y][x] = fg;
    }
  }

  // Middle point of }
  for (let t = 0; t < thickness + 1; t++) {
    for (let ty = -1; ty <= 1; ty++) {
      if (midY + ty >= 0 && midY + ty < size && rightX + t < size) {
        canvas[midY + ty][rightX + t] = fg;
      }
    }
  }

  return canvas;
}

function canvasToPPM(canvas, size) {
  let ppm = `P6\n${size} ${size}\n255\n`;
  const data = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      data.push(canvas[y][x][0], canvas[y][x][1], canvas[y][x][2]);
    }
  }
  return { header: ppm, data: Buffer.from(data) };
}

// Generate icons
const sizes = [16, 48, 128];
const iconDir = path.join(__dirname, '..', 'extension', 'icons');

for (const size of sizes) {
  const canvas = createIcon(size);
  const { header, data } = canvasToPPM(canvas, size);
  const ppmPath = path.join(iconDir, `icon${size}.ppm`);

  // Write PPM file
  fs.writeFileSync(ppmPath, header);
  fs.appendFileSync(ppmPath, data);

  console.log(`Generated ${ppmPath}`);
}

console.log('\nConvert to PNG with: for f in extension/icons/*.ppm; do convert "$f" "${f%.ppm}.png"; rm "$f"; done');
