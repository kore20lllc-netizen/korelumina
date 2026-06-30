#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const CHANGELOG_PATH = path.join(
  ROOT,
  "docs",
  "architecture",
  "ARCHITECTURE_CHANGELOG.md",
);

const requiredFields = [
  "ticket",
  "phase",
  "title",
  "status",
  "summary",
  "implementation",
  "architectureImpact",
  "compatibility",
  "validation",
  "followUp",
];

function fail(message) {
  console.error(`[log-change] ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(
      fs.readFileSync(filePath, "utf8"),
    );
  } catch (error) {
    fail(
      `failed to read valid JSON from ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function assertString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    fail(`missing or invalid string field: ${field}`);
  }
}

function assertStringArray(value, field) {
  if (!Array.isArray(value)) {
    fail(`missing or invalid array field: ${field}`);
  }

  for (const item of value) {
    if (typeof item !== "string" || !item.trim()) {
      fail(`invalid item in array field: ${field}`);
    }
  }
}

function validate(change) {
  for (const field of requiredFields) {
    if (!(field in change)) {
      fail(`missing required field: ${field}`);
    }
  }

  assertString(change.ticket, "ticket");
  assertString(change.phase, "phase");
  assertString(change.title, "title");
  assertString(change.status, "status");
  assertString(change.summary, "summary");

  assertStringArray(change.implementation, "implementation");
  assertStringArray(change.architectureImpact, "architectureImpact");
  assertStringArray(change.compatibility, "compatibility");
  assertStringArray(change.validation, "validation");
  assertStringArray(change.followUp, "followUp");
}

function list(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function render(change) {
  const today =
    new Date().toISOString().slice(0, 10);

  return [
    `## ${today} — ${change.ticket} ${change.phase}`,
    "",
    `### ${change.title}`,
    "",
    "**Status**",
    change.status,
    "",
    "**Summary**",
    change.summary,
    "",
    "**Implementation**",
    list(change.implementation),
    "",
    "**Architecture Impact**",
    list(change.architectureImpact),
    "",
    "**Compatibility**",
    list(change.compatibility),
    "",
    "**Validation**",
    list(change.validation),
    "",
    "**Follow-up**",
    list(change.followUp),
    "",
  ].join("\n");
}

function main() {
  const jsonPath = process.argv[2];

  if (!jsonPath) {
    fail("usage: log-change.js <change.json>");
  }

  const absoluteJsonPath = path.resolve(
    ROOT,
    jsonPath,
  );

  const change = readJson(absoluteJsonPath);
  validate(change);

  if (!fs.existsSync(CHANGELOG_PATH)) {
    fail(`changelog not found: ${CHANGELOG_PATH}`);
  }

  const current = fs.readFileSync(
    CHANGELOG_PATH,
    "utf8",
  );

  const duplicatePattern = new RegExp(
    `^## .* — ${change.ticket}\\b`,
    "m",
  );

  if (duplicatePattern.test(current)) {
    fail(`ticket already exists in changelog: ${change.ticket}`);
  }

  const next =
    current.replace(/\s*$/, "\n\n") +
    render(change);

  fs.writeFileSync(
    CHANGELOG_PATH,
    next,
    "utf8",
  );

  console.log(
    `[log-change] appended ${change.ticket} to ${CHANGELOG_PATH}`,
  );
}

main();
