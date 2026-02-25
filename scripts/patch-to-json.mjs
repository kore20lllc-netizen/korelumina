#!/usr/bin/env node
import fs from "fs";

function die(msg) {
  console.error(msg);
  process.exit(1);
}

// Usage:
// node scripts/patch-to-json.mjs raw-patch.txt patch.json default kid-transit-eye
const inputPath = process.argv[2] || "raw-patch.txt";
const outputPath = process.argv[3] || "patch.json";
const workspaceId = process.argv[4] || "default";
const projectId = process.argv[5] || "kid-transit-eye";

if (!fs.existsSync(inputPath)) die(`Missing input file: ${inputPath}`);

const raw = fs.readFileSync(inputPath, "utf8");

// Expected blocks (from AI):
// FILE: path/to/file
// ACTION: create|update
// CONTENT:
// <file content...>
// FILE: ...
//
// We ignore ACTION; apply uses path+content only.

const lines = raw.replace(/\r\n/g, "\n").split("\n");

const files = [];
let i = 0;

function startsWithLabel(line, label) {
  return line.startsWith(label);
}

while (i < lines.length) {
  const line = lines[i];

  if (!startsWithLabel(line, "FILE:")) {
    i++;
    continue;
  }

  const filePath = line.slice("FILE:".length).trim();
  if (!filePath) die(`Found FILE: with empty path at line ${i + 1}`);

  i++;

  // Optional ACTION line
  if (i < lines.length && startsWithLabel(lines[i], "ACTION:")) {
    i++;
  }

  // Require CONTENT:
  if (i >= lines.length || !startsWithLabel(lines[i], "CONTENT:")) {
    die(`Missing CONTENT: for file "${filePath}" near line ${i + 1}`);
  }

  i++; // move to first content line

  const contentLines = [];
  while (i < lines.length) {
    const l = lines[i];

    // Next block begins
    if (startsWithLabel(l, "FILE:")) break;

    contentLines.push(l);
    i++;
  }

  // Preserve exact newlines (no trimming)
  const content = contentLines.join("\n");

  files.push({ path: filePath, content });
}

// Allow empty only if you really want it
if (files.length === 0) die("No FILE: blocks found in raw-patch.txt");

const payload = { workspaceId, projectId, files };

fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.error(`Wrote ${outputPath} with ${files.length} file(s).`);
