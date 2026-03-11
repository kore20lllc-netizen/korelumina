import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({
      allowed: true,
      remaining: 9999,
      plan: 'dev',
    });
  }

  return NextResponse.json(
    { error: 'Quota check not configured' },
    { status: 500 }
  );
}
