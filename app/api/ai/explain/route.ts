import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let body: any = {};

    // 🔒 Safe body parsing (no crash)
    try {
      const text = await req.text();
      if (text && text.trim().length > 0) {
        body = JSON.parse(text);
      }
    } catch {
      body = {};
    }

    const { file, oldCode, newCode } = body;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 }
      );
    }

    const prompt = `
Explain the code changes clearly.

File: ${file}

OLD:
${oldCode || ""}

NEW:
${newCode || ""}

Return:
- bullet points
- max 5
`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json().catch(() => ({}));
    console.log("OPENAI RAW:", JSON.stringify(data, null, 2));
    
    const text =
      data?.choices?.[0]?.message?.content ||
      "No explanation generated";

    return NextResponse.json({ ok: true, text });
  } catch (err: any) {
    console.error("Explain error:", err);

    return NextResponse.json(
      { ok: false, error: "Explain failed" },
      { status: 500 }
    );
  }
}
