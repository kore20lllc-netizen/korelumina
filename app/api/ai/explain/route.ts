import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const file = body.file || "";
    const oldCode = body.oldCode || "";
    const newCode = body.newCode || "";

    const systemPrompt =
      "You are a senior software engineer. " +
      "Explain ONLY the actual code differences. " +
      "Rules: max 5 bullets, no filler, no generic statements, " +
      "no describing unchanged code. " +
      "If no changes, return: No changes detected.";

    const userPrompt =
      "Compare OLD vs NEW and list only real differences.\n\n" +
      "OLD:\n" + oldCode + "\n\n" +
      "NEW:\n" + newCode;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await res.json().catch(() => ({}));

    const text =
      (data &&
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content &&
        data.choices[0].message.content.trim()) ||
      "No explanation generated";

    return NextResponse.json({ ok: true, text });
  } catch (err) {
    console.error("Explain error:", err);
    return NextResponse.json(
      { ok: false, error: "Explain failed" },
      { status: 500 }
    );
  }
}
