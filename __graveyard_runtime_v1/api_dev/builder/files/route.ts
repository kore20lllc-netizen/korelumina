import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json([
    { path: 'app/page.tsx', type: 'file', content: '<h1>Hello Builder</h1>' },
    { path: 'app/layout.tsx', type: 'file', content: '<html />' },
    { path: 'components/Button.tsx', type: 'file', content: 'export function Button() {}' },
  ]);
}
