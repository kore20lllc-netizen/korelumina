import { NextResponse } from 'next/server';

let lastUpdate = Date.now();

export async function POST() {
  lastUpdate = Date.now();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ lastUpdate });
}
