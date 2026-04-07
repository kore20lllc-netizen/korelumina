export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const spec = body?.spec || "No input";

    // ALWAYS return valid, standalone React page
    const code = `
export default function Page() {
  return (
    <div style={{ padding: 40, fontSize: 24 }}>
      <h1>AI Output</h1>
      <p>${spec}</p>
    </div>
  );
}
`;

    return new Response(
      JSON.stringify({
        ok: true,
        drafts: [
          {
            file: "app/page.tsx",
            code,
          },
        ],
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err.message || "orchestrate failed",
      }),
      { status: 500 }
    );
  }
}
