export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { spec } = await req.json();

    // 🔥 Simple multi-file generator (deterministic, no AI yet)
    // Later you replace with real LLM

    const drafts = [];

    // Always include main page
    drafts.push({
      file: "app/page.tsx",
      code: `
import Layout from "../components/Layout";

export default function Page() {
  return (
    <Layout>
      <h1>${spec}</h1>
    </Layout>
  );
}
`,
    });

    // Add layout
    drafts.push({
      file: "components/Layout.tsx",
      code: `
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 40 }}>
      <div style={{ marginBottom: 20, fontWeight: 700 }}>
        KoreLumina App
      </div>
      {children}
    </div>
  );
}
`,
    });

    // Optional component (based on spec keyword)
    if ((spec || "").toLowerCase().includes("card")) {
      drafts.push({
        file: "components/Card.tsx",
        code: `
export default function Card({ title }: { title: string }) {
  return (
    <div style={{
      padding: 20,
      border: "1px solid #ddd",
      borderRadius: 10,
      marginTop: 20
    }}>
      {title}
    </div>
  );
}
`,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        drafts,
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
