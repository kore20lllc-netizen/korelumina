"use client";

import { useEffect, useMemo, useState } from "react";
import SnapshotPanel from "@/components/master-os/SnapshotPanel";
import DiffPanel from "@/components/master-os/DiffPanel";

type Draft = {
  file?: string;
  path?: string;
  code?: string;
  content?: string;
  explanation?: string;
};

const MODULES = [
  "builder-core",
  "ai-planner-diff",
  "repo-import",
  "runtime-preview",
  "production-hardening",
];

export default function MasterOS() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[MASTER OS] env not fully configured");
  }
  console.warn("[MASTER OS LOCK ACTIVE]");

  const [input, setInput] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState("builder-core");
  const [previewKey, setPreviewKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [approved, setApproved] = useState<Record<string, boolean>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const projectId = "korelumina-dogfood";

  function log(msg: string) {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  function draftKey(d: Draft, index: number) {
    return `${d.file || d.path || "app/page.tsx"}::${index}`;
  }

  function toggleApprove(key: string) {
    setApproved((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function generate() {
    if (!input.trim() || isGenerating) return;

    setIsGenerating(true);
    log("Generating drafts...");

    try {
      const res = await fetch("/api/ai/orchestrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: "repo-test",
          spec: input,
        }),
      });

      const data = await res.json();
      const nextDrafts: Draft[] = data?.drafts || [];

      setDrafts(nextDrafts);
      autoExplainDrafts(nextDrafts);

      const nextApproved: Record<string, boolean> = {};
      nextDrafts.forEach((d, i) => {
        nextApproved[draftKey(d, i)] = false;
      });
      setApproved(nextApproved);

      log(`Generated ${nextDrafts.length} draft(s)`);
    } catch (err) {
      console.error(err);
      log("Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  async function applyApproved() {
    if (isApplying) return;

    const selected = drafts.filter((d, i) => approved[draftKey(d, i)]);
    if (selected.length === 0) {
      log("No approved drafts");
      return;
    }

    setIsApplying(true);
    log(`Applying ${selected.length} draft(s)...`);

    try {
      const res = await fetch("/api/ai/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: "repo-test",
          drafts: selected,
        }),
      });

      const data = await res.json();

      if (!data?.ok) {
        log("Apply completed with errors");
      } else {
        log("Apply successful");
      }

      setDrafts([]);
      setApproved({});
      setPreviewKey(Date.now());
    } catch (err) {
      console.error(err);
      log("Apply failed");
    } finally {
      setIsApplying(false);
    }
  }

  async function autoExplainDrafts(drafts: Draft[]) {
    try {
      const results = await Promise.all(
        drafts.map(async (d) => {
          const file = d.file || d.path || "app/page.tsx";
          const newCode = d.code || d.content || "";

          let oldCode = "";
          try {
            const res = await fetch(
              `/api/dev/fs/read?projectId=repo-test&file=${encodeURIComponent(file)}`
            );
            oldCode = await res.text();
          } catch {}

          const res = await fetch("/api/ai/explain", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file, oldCode, newCode }),
          });

          const data = await res.json().catch(() => ({}));

          return {
            ...d,
            explanation: data?.text || "",
          };
        })
      );

      setDrafts(results);
    } catch (err) {
      console.error(err);
    }
  }

  const approvedCount = useMemo(
    () => Object.values(approved).filter(Boolean).length,
    [approved]
  );

  useEffect(() => {
    log("Master OS ready");
  }, []);

  useEffect(() => {
    async function loadPreview() {
      try {
        const res = await fetch(`/api/dev/preview?projectId=${projectId}`);
        const data = await res.json();
        if (data?.ok && data?.url) {
          setPreviewUrl(data.url);
        } else {
          console.error("Preview failed", data);
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadPreview();
  }, [projectId, previewKey]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#fff",
        padding: 20,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr 420px",
          gap: 20,
          height: "calc(100vh - 40px)",
        }}
      >
        <div style={{ background: "#0b1220", borderRadius: 12, padding: 14 }} />
        <div />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              flex: 1,
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Builder Preview</div>

            {previewUrl ? (
              <iframe
                key={previewKey}
                src={previewUrl}
                style={{
                  width: "100%",
                  flex: 1,
                  border: "none",
                  borderRadius: 10,
                  background: "#fff",
                }}
              />
            ) : (
              <div style={{ padding: 20 }}>Loading preview...</div>
            )}

            <SnapshotPanel
              refreshKey={previewKey}
              onRestore={() => setPreviewKey(Date.now())}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
