import { NextResponse } from "next/server";

type Draft = {
  file: string;
  code: string;
};

export async function POST() {
  const drafts: Draft[] = [];

  // Always include main page
  drafts.push({
    file: "app/page.tsx",
    code: `
import Layout from "../components/Layout";

export default function Page() {
  return <Layout />;
}
`.trim(),
  });

  return NextResponse.json({
    ok: true,
    owner: "korelumina",
    drafts,
  });
}
