import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Safe root directory for all file writes
const SAFE_ROOT = path.join(process.cwd(), '.lumina_sandbox');

interface FileWrite {
  path: string;
  content: string;
}

interface ApplyRequest {
  files: FileWrite[];
}

interface ApplyResponse {
  success: boolean;
  appliedFiles: string[];
  errors: string[];
}

/**
 * Validates that a file path is safe to write to
 * - No path traversal (..)
 * - No absolute paths
 * - Must resolve within SAFE_ROOT
 */
function validatePath(filePath: string): boolean {
  // Check for path traversal attempts
  if (filePath.includes('..')) {
    return false;
  }

  // Check for absolute paths
  if (path.isAbsolute(filePath)) {
    return false;
  }

  // Resolve the full path and ensure it's within SAFE_ROOT
  const fullPath = path.join(SAFE_ROOT, filePath);
  const resolved = path.resolve(fullPath);
  const safeRoot = path.resolve(SAFE_ROOT);

  return resolved.startsWith(safeRoot);
}

/**
 * POST /api/apply
 * Applies file changes to disk within the safe sandbox directory
 */
export async function POST(request: NextRequest) {
  try {
    const body: ApplyRequest = await request.json();
    const { files } = body;

    if (!files || !Array.isArray(files)) {
      return NextResponse.json(
        {
          success: false,
          appliedFiles: [],
          errors: ['Invalid request: files array required'],
        } as ApplyResponse,
        { status: 400 }
      );
    }

    const appliedFiles: string[] = [];
    const errors: string[] = [];

    // Ensure safe root directory exists
    try {
      await fs.mkdir(SAFE_ROOT, { recursive: true });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          appliedFiles: [],
          errors: [`Failed to create sandbox directory: ${error instanceof Error ? error.message : 'Unknown error'}`],
        } as ApplyResponse,
        { status: 500 }
      );
    }

    // Process each file
    for (const file of files) {
      const { path: filePath, content } = file;

      // Validate path
      if (!validatePath(filePath)) {
        errors.push(`Invalid path: ${filePath}`);
        continue;
      }

      try {
        const fullPath = path.join(SAFE_ROOT, filePath);
        const dir = path.dirname(fullPath);

        // Create directory if it doesn't exist
        await fs.mkdir(dir, { recursive: true });

        // Write file
        await fs.writeFile(fullPath, content, 'utf-8');

        appliedFiles.push(filePath);
      } catch (error) {
        errors.push(
          `Failed to write ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    const success = errors.length === 0;

    return NextResponse.json(
      {
        success,
        appliedFiles,
        errors,
      } as ApplyResponse,
      { status: success ? 200 : 207 } // 207 Multi-Status for partial success
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        appliedFiles: [],
        errors: [`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      } as ApplyResponse,
      { status: 500 }
    );
  }
}
