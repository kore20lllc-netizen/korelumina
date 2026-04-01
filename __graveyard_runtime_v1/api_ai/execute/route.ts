import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: body.messages ?? [],
    });

    return NextResponse.json({
      ok: true,
      output: response.choices[0]?.message?.content ?? "",
    });

  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Execution error" },
      { status: 500 }
    );
  }
}
