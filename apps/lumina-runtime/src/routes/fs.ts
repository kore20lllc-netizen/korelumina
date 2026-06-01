import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Express } from "express";

import { getProjectPath } from "../projects/getProjectPath.js";

const MAX_FILE_BYTES = 1024 * 1024 * 2;

function normalizeFilePath(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("missing_file");
  }

  const normalized = value.replace(/\\/g, "/").trim();

  if (
    !normalized ||
    normalized.startsWith("/") ||
    normalized.includes("../") ||
    normalized === ".." ||
    normalized.includes("\0")
  ) {
    throw new Error("invalid_file_path");
  }

  return normalized;
}

function resolveProjectFile(projectId: string, file: string) {
  const projectPath = getProjectPath(projectId);
  const safeFile = normalizeFilePath(file);
  const targetPath = path.resolve(projectPath, safeFile);
  const relative = path.relative(projectPath, targetPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("file_path_escape_detected");
  }

  return {
    projectPath,
    file: safeFile,
    targetPath,
  };
}

function hashContent(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function atomicWriteFile(targetPath: string, content: string) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });

  const tmpPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, content, "utf8");
  fs.renameSync(tmpPath, targetPath);
}

function listFiles(root: string) {
  const files: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === "dist" ||
        entry.name === ".next"
      ) {
        continue;
      }

      const full = path.join(dir, entry.name);
      const relative = path.relative(root, full).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        walk(full);
        continue;
      }

      if (entry.isFile()) {
        files.push(relative);
      }
    }
  }

  walk(root);
  return files.sort();
}

export function registerFsRoute(app: Express) {
  app.get("/api/runtime/fs/list", (req, res) => {
    try {
      const projectId =
        typeof req.query.projectId === "string"
          ? req.query.projectId
          : "";

      const projectPath = getProjectPath(projectId);

      return res.json({
        ok: true,
        projectId,
        files: listFiles(projectPath),
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: error instanceof Error ? error.message : "failed_to_list_files",
      });
    }
  });

  app.get("/api/runtime/fs/read", (req, res) => {
    try {
      const projectId =
        typeof req.query.projectId === "string"
          ? req.query.projectId
          : "";

      const requestedFile =
  typeof req.query.file === "string"
    ? req.query.file
    : undefined;

if (!requestedFile) {
  return res.status(400).json({
    ok: false,
    error: "missing_file",
  });
}

const { file, targetPath } = resolveProjectFile(
  projectId,
  requestedFile,
);

      if (!fs.existsSync(targetPath)) {
        return res.status(404).json({
          ok: false,
          error: "file_not_found",
          projectId,
          file,
        });
      }

      const stat = fs.statSync(targetPath);

      if (!stat.isFile()) {
        throw new Error("not_a_file");
      }

      if (stat.size > MAX_FILE_BYTES) {
        throw new Error("file_too_large");
      }

      const content = fs.readFileSync(targetPath, "utf8");

      return res.json({
        ok: true,
        projectId,
        file,
        content,
        sha256: hashContent(content),
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: error instanceof Error ? error.message : "failed_to_read_file",
      });
    }
  });

  app.post("/api/runtime/fs/write", (req, res) => {
    try {
      const projectId =
        typeof req.body?.projectId === "string"
          ? req.body.projectId
          : "";

      const content =
        typeof req.body?.content === "string"
          ? req.body.content
          : "";

      if (Buffer.byteLength(content, "utf8") > MAX_FILE_BYTES) {
        throw new Error("content_too_large");
      }

      const { file, targetPath } = resolveProjectFile(
        projectId,
        req.body?.file,
      );

      const previousContent = fs.existsSync(targetPath)
        ? fs.readFileSync(targetPath, "utf8")
        : "";

      if (
        typeof req.body?.expectedSha256 === "string" &&
        req.body.expectedSha256 &&
        hashContent(previousContent) !== req.body.expectedSha256
      ) {
        return res.status(409).json({
          ok: false,
          error: "file_changed",
          projectId,
          file,
          currentSha256: hashContent(previousContent),
        });
      }

      atomicWriteFile(targetPath, content);

      return res.json({
        ok: true,
        projectId,
        file,
        sha256: hashContent(content),
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: error instanceof Error ? error.message : "failed_to_write_file",
      });
    }
  });
}
