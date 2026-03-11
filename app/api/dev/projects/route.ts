import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    id: 'dev-project-1',
    name: 'Dev Project',
    framework: 'nextjs',
    createdAt: new Date().toISOString(),
  });
}
