"use client";

import { useEffect, useState } from "react";

const MODULES = [
  "builder-core",
  "ai-planner-diff",
  "repo-import",
  "runtime-preview",
  "production-hardening",
];

type Draft = {
  file: string;
  code: string;
  approved?: boolean;
};

export default function MasterOS() {
  const [state, setState] = useState<any>({});
  const [input, setInput] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeModule, setActiveModule] = useState("builder-core");
  const [previewKey, setPreviewKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [refreshSpin, setRefreshSpin] = useState(false);

  function log(msg: string) {
    setLogs((p) => [...p, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  async function load() {
    setRefreshSpin(true);
    try {
      const res = await fetch("/api/master-os");
      const data = await res.json();
      setState(data.state || {});
    } finally {
      setTimeout(() => setRefreshSpin(false), 400);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSystem(owner: string) {
    await fetch("/api/master-os", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentTask: {
          title: input,
          owner,
        },
      }),
    });

    await load();
  }

  async function generatePlan() {
    if (!input.trim() || isGenerating) return;

    setIsGenerating(true);
    log("Generating plan...");

    try {
      const res = await fetch("/api/ai/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "repo-test",
          prompt: input,
        }),
      });

      const data = await res.json();

      const owner = data.owner || "builder-core";
      setActiveModule(owner);
      await saveSystem(owner);

      const next = (data.drafts || []).map((d: Draft) => ({
        ...d,
        approved: false,
      }));

      setDrafts(next);
      log(`Plan ready: ${next.length} file(s)`);
    } catch (error) {
      console.error(error);
      log("Plan generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  function toggle(file: string) {
    setDrafts((prev) =>
      prev.map((d) => (d.file === file ? { ...d, approved: !d.approved } : d))
    );
  }

  async function apply() {
    if (isApplying) return;

    const approved = drafts.filter((d) => d.approved);

    if (!approved.length) {
      log("No approved files");
      return;
    }

    setIsApplying(true);
    log("Applying...");

    try {
      await fetch("/api/ai/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: "repo-test",
          drafts: approved,
        }),
      });

      log("Applied");

      setPreviewKey(Date.now());

      log("Preview refreshed");
    } catch (error) {
      console.error(error);
      log("Apply failed");
    } finally {
      setIsApplying(false);
    }
  }

  function statusColor(m: string) {
    if (state.currentTask?.owner === m) return "#22c55e";
    return "#ef4444";
  }

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 rgba(59,130,246,0.0); }
          50% { box-shadow: 0 0 18px rgba(59,130,246,0.30); }
          100% { box-shadow: 0 0 0 rgba(59,130,246,0.0); }
        }
      `}</style>

      <div style={styles.header}>
        <div>
          <div style={styles.title}>KoreLumina Master OS</div>
          <div style={styles.sub}>
            {state.currentProject || "repo-test"} · main
          </div>
        </div>

        <div style={styles.headerRight}>
          <span style={{ ...styles.status, color: "#22c55e" }}>BUILD</span>
          <span style={{ ...styles.status, color: "#eab308" }}>AI</span>
          <span style={{ ...styles.status, color: "#22c55e" }}>PREVIEW</span>

          <button
            onClick={load}
            style={{
              ...styles.refresh,
              transform: refreshSpin ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.35s ease, box-shadow 0.2s ease, border-color 0.2s ease",
            }}
          >
            ↻
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Modules</div>

          {MODULES.map((m) => (
            <div
              key={m}
              onClick={() => setActiveModule(m)}
              style={{
                ...styles.module,
                border: activeModule === m ? "1px solid #3b82f6" : "1px solid transparent",
                background: activeModule === m ? "rgba(59,130,246,0.15)" : "transparent",
                boxShadow:
                  activeModule === m ? "0 0 18px rgba(59,130,246,0.25)" : "none",
                transform: activeModule === m ? "translateY(-1px)" : "translateY(0)",
              }}
            >
              <span>{m}</span>
              <span
                style={{
                  ...styles.dot,
                  background: statusColor(m),
                }}
              />
            </div>
          ))}
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>AI Command Center</div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to build..."
            style={styles.textarea}
          />

          <div style={styles.row}>
            <button
              style={{
                ...styles.btnPrimary,
                opacity: isGenerating ? 0.75 : 1,
                cursor: isGenerating ? "not-allowed" : "pointer",
                animation: isGenerating ? "pulseGlow 1.2s ease-in-out infinite" : "none",
              }}
              onClick={generatePlan}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Send"}
            </button>

            <button
              style={{
                ...styles.btnSecondary,
                opacity: isApplying ? 0.75 : 1,
                cursor: isApplying ? "not-allowed" : "pointer",
                animation: isApplying ? "pulseGlow 1.2s ease-in-out infinite" : "none",
              }}
              onClick={apply}
              disabled={isApplying}
            >
              {isApplying ? "Applying..." : "Approve & Execute"}
            </button>
          </div>

          {drafts.map((d) => (
            <div key={d.file} style={styles.diffCard}>
              <div style={styles.fileHeader}>
                {d.file}

                <button
                  onClick={() => toggle(d.file)}
                  style={{
                    ...styles.approveBtn,
                    background: d.approved
                      ? "linear-gradient(135deg,#16a34a,#22c55e)"
                      : "rgba(255,255,255,0.04)",
                    color: d.approved ? "#fff" : "#cbd5e1",
                    border: d.approved
                      ? "1px solid rgba(34,197,94,0.5)"
                      : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: d.approved
                      ? "0 0 14px rgba(34,197,94,0.22)"
                      : "none",
                    transform: d.approved ? "translateY(-1px)" : "translateY(0)",
                  }}
                >
                  {d.approved ? "Approved" : "Approve"}
                </button>
              </div>

              <pre style={styles.code}>{d.code}</pre>
            </div>
          ))}
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>System State</div>

          <div style={styles.systemItem}>Task: {state.currentTask?.title || "none"}</div>
          <div style={styles.systemItem}>Owner: {state.currentTask?.owner || "-"}</div>
          <div style={styles.systemItem}>Approved: {drafts.filter((d) => d.approved).length}</div>

          <div style={{ marginTop: 20 }}>
            <div style={styles.panelTitle}>Live Preview</div>

            <iframe
              key={previewKey}
              src="/builder?projectId=repo-test"
              style={styles.preview}
            />
          </div>
        </div>
      </div>

      <div style={styles.logPanel}>
        <div style={styles.panelTitle}>Execution Log</div>

        {logs.map((l, i) => (
          <div key={i} style={styles.logLine}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    padding: 20,
    background: "radial-gradient(circle at top, #0b1220, #020617)",
    color: "#fff",
    minHeight: "100vh",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  headerRight: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },

  status: {
    fontSize: 11,
    letterSpacing: 1,
    transition: "opacity 0.2s ease",
  },

  refresh: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "4px 10px",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 0 0 rgba(59,130,246,0)",
  },

  title: { fontSize: 18, fontWeight: 600 },
  sub: { fontSize: 12, color: "#94a3b8" },

  grid: {
    display: "grid",
    gridTemplateColumns: "260px 1fr 380px",
    gap: 20,
  },

  panel: {
    padding: 16,
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(10px)",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.06)",
    transition: "box-shadow 0.25s ease, border-color 0.25s ease, transform 0.2s ease",
  },

  panelTitle: {
    marginBottom: 12,
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: 600,
  },

  module: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    transition: "background 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 0 10px rgba(255,255,255,0.12)",
  },

  textarea: {
    width: "100%",
    height: 100,
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#fff",
    padding: 10,
    marginBottom: 12,
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },

  row: {
    display: "flex",
    gap: 10,
  },

  btnPrimary: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    background: "linear-gradient(135deg,#3b82f6,#6366f1)",
    border: "none",
    color: "#fff",
    fontWeight: 500,
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease",
    boxShadow: "0 8px 20px rgba(59,130,246,0.22)",
  },

  btnSecondary: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    border: "none",
    color: "#fff",
    fontWeight: 500,
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease",
    boxShadow: "0 8px 20px rgba(37,99,235,0.22)",
  },

  approveBtn: {
    fontSize: 11,
    padding: "4px 10px",
    borderRadius: 999,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  systemItem: {
    fontSize: 13,
    marginBottom: 6,
  },

  diffCard: {
    marginTop: 10,
    padding: 10,
    background: "#020617",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.06)",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },

  fileHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  code: {
    fontSize: 12,
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
  },

  preview: {
    width: "100%",
    height: 400,
    border: "none",
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
  },

  logPanel: {
    marginTop: 20,
    padding: 12,
    background: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.06)",
  },

  logLine: {
    color: "#22c55e",
    fontSize: 12,
  },
};
