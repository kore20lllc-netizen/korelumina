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

 // 🔒 MASTER OS GUARD (ADD EXACTLY HERE)
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
        {/* LEFT */}
        <div
          style={{
            background: "#0b1220",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 14,
            overflow: "auto",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Modules</div>

          {MODULES.map((m) => (
            <div
              key={m}
              onClick={() => setActiveModule(m)}
              style={{
                padding: 10,
                marginBottom: 8,
                borderRadius: 10,
                cursor: "pointer",
                background:
                  activeModule === m ? "rgba(59,130,246,0.18)" : "transparent",
                border:
                  activeModule === m
                    ? "1px solid rgba(59,130,246,0.5)"
                    : "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {m}
            </div>
          ))}
        </div>

        {/* CENTER */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minWidth: 0,
          }}
        >
          <div
            style={{
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 12 }}>
              Master OS Command Center
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe what to build..."
              style={{
                width: "100%",
                minHeight: 90,
                background: "#020617",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: 12,
                resize: "vertical",
                outline: "none",
              }}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button
                onClick={generate}
                style={{
                  padding: "10px 14px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {isGenerating ? "Generating..." : "Generate Drafts"}
              </button>

              <button
                onClick={applyApproved}
                style={{
                  padding: "10px 14px",
                  background: "#22c55e",
                  color: "#000",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {isApplying ? "Applying..." : `Apply Approved (${approvedCount})`}
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 16,
              overflow: "auto",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Drafts</div>

            {drafts.length === 0 ? (
              <div style={{ opacity: 0.65 }}>No drafts</div>
            ) : (
              drafts.map((d, i) => {
  const key = draftKey(d, i);
  const file = d.file || d.path || "app/page.tsx";
  const code = d.code || d.content || "";

  return (
    <div
      key={key}
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        marginBottom: 14,
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 12,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        <div style={{ fontFamily: "monospace", fontSize: 13 }}>
          {file}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => toggleApprove(key)}
            style={{
              padding: "8px 12px",
              background: approved[key] ? "#22c55e" : "#334155",
              color: approved[key] ? "#000" : "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {approved[key] ? "Approved" : "Approve"}
          </button>

          <button
            onClick={() =>
              setDrafts((prev) => prev.filter((_, idx) => idx !== i))
            }
            style={{
              padding: "8px 12px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Reject
          </button>
        </div>
      </div>

      {/* EXPLANATION (OUTSIDE HEADER) */}
      {d.explanation && (
        <div
          style={{
            fontSize: 12,
            padding: 10,
            background: "#020617",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            whiteSpace: "pre-wrap",
          }}
        >
          {d.explanation}
        </div>
      )}

      {/* DIFF PANEL */}
      <div
        style={{
          padding: 12,
          overflow: "auto",
          fontSize: 12,
          background: "#020617",
        }}
      >
        <DiffPanel file={file} newCode={code} />
      </div>
    </div>
  );
})   
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "#0b1220",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 16,
              minHeight: 220,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Execution Log</div>

            <div
              style={{
                maxHeight: 220,
                overflow: "auto",
                fontFamily: "monospace",
                fontSize: 12,
                color: "#93c5fd",
              }}
            >
              {logs.map((l, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  {l}
                </div>
              ))}
            </div>
          </div>

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

            <iframe
              key={previewKey}
              src={`/builder?projectId=repo-test&v=${previewKey}`}
              style={{
                width: "100%",
                flex: 1,
                border: "none",
                borderRadius: 10,
                background: "#fff",
              }}
            />
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
