import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

// Safe root directory for all operations (same as apply route)
const SAFE_ROOT = path.join(process.cwd(), '.lumina_sandbox');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packages, packageManager = 'npm' } = body;
    
    // Validate input
    if (!Array.isArray(packages) || packages.length === 0) {
      return Response.json(
        { error: 'No packages specified' },
        { status: 400 }
      );
    }
    
    // Validate package manager
    if (!['npm', 'pnpm', 'yarn'].includes(packageManager)) {
      return Response.json(
        { error: 'Invalid package manager' },
        { status: 400 }
      );
    }
    
    // Validate all package names
    const validPackages: string[] = [];
    for (const pkg of packages) {
      if (typeof pkg !== 'string') {
        return Response.json(
          { error: 'Invalid package name type' },
          { status: 400 }
        );
      }
      
      if (!isValidPackageName(pkg)) {
        return Response.json(
          { error: `Invalid package name: ${pkg}` },
          { status: 400 }
        );
      }
      
      validPackages.push(pkg);
    }
    
    // Ensure sandbox directory exists
    await fs.mkdir(SAFE_ROOT, { recursive: true });
    
    // Build install command with security flags
    let command: string;
    let args: string[];
    
    if (packageManager === 'npm') {
      command = 'npm';
      args = ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...validPackages];
    } else if (packageManager === 'pnpm') {
      command = 'pnpm';
      args = ['install', '--ignore-scripts', ...validPackages];
    } else {
      command = 'yarn';
      args = ['add', '--ignore-scripts', ...validPackages];
    }
    
    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Spawn process in sandbox directory
        const proc = spawn(command, args, {
          cwd: SAFE_ROOT,
          shell: false, // SECURITY: No shell to prevent injection
          timeout: 300000, // 5 minute timeout
        });
        
        // Stream stdout
        proc.stdout?.on('data', (data) => {
          controller.enqueue(encoder.encode(`data: ${data.toString()}\n\n`));
        });
        
        // Stream stderr
        proc.stderr?.on('data', (data) => {
          controller.enqueue(encoder.encode(`data: ${data.toString()}\n\n`));
        });
        
        // Handle process completion
        proc.on('close', (code) => {
          controller.enqueue(encoder.encode(`data: [DONE:${code}]\n\n`));
          controller.close();
        });
        
        // Handle errors
        proc.on('error', (err) => {
          controller.enqueue(encoder.encode(`data: ERROR: ${err.message}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE:1]\n\n`));
          controller.close();
        });
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Validate package name to prevent shell injection
 * Allows: alphanumeric, hyphens, underscores, @, / (for scoped packages), dots
 */
function isValidPackageName(name: string): boolean {
  if (!name || name.length === 0 || name.length > 100) {
    return false;
  }
  
  // Must match valid npm package name pattern
  // Allows @scope/package-name format and dots for sub-packages
  return /^(@[a-z0-9\-]+\/)?[a-z0-9\-_.]+$/.test(name);
}
