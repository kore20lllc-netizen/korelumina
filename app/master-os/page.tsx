"use client";

import { useEffect, useRef, useState } from "react";

const modules = [
  "builder-core",
  "ai-planner-diff",
  "repo-import",
  "runtime-preview",
  "production-hardening",
] as const;

type ModuleName = (typeof modules)[number];
type Status = "green" | "yellow" | "red";

export default function MasterOSPage() {
  const [state, setState] = useState<any>({});
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [owner, setOwner] = useState<ModuleName>("builder-core");
  const [selectedModule, setSelectedModule] = useState<ModuleName>("builder-core");
  const [logs, setLogs] = useState<string[]>([]);

  const logRef = useRef<HTMLDivElement>(null);

  function addLog(msg: string) {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  function load() {
    fetch("/api/master-os", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setState(d.state || {}))
      .catch(() => setState({}));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  async function executeTask() {
    addLog("Execution complete");

// 🔥 force preview refresh
fetch(`/api/dev/preview/bundle?projectId=${state.currentProject || "demo-project"}`)
  .then(() => addLog("Preview refreshed"))
  .catch(() => addLog("Preview refresh failed"));

    try {
      const res = await fetch("/api/ai/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: state.currentProject || "demo-project",
          prompt: taskTitle || taskDescription,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        addLog("Streaming not supported");
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        chunk.split("\\n").forEach((line) => {
          if (line.trim()) addLog(line);
        });
      }

      addLog("Execution complete");
    } catch (error) {
      addLog("Execution failed");
      console.error(error);
    }
  }

  function statusColor(s?: Status) {
    if (s === "green") return "#22c55e";
    if (s === "yellow") return "#eab308";
    return "#ef4444";
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>KoreLumina Master OS</div>
          <div style={styles.meta}>
            {state.currentProject || "repo-test"} · {state.currentBranch || "main"} ·{" "}
            {state.lastStableTag || "master-os-v1-stable"}
          </div>
        </div>

        <div style={styles.headerRight}>
          <span style={styles.ok}>BUILD OK</span>
          <span style={styles.ok}>PREVIEW OK</span>
          <button onClick={load} style={styles.refresh}>↻</button>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.panel}>
          <div style={styles.panelTitle}>Modules</div>

          {modules.map((m) => {
            const info = state.modules?.[m] || {};
            const active = selectedModule === m;

            return (
              <div
                key={m}
                onClick={() => {
                  setSelectedModule(m);
                  setOwner(m);
                }}
                style={{
                  ...styles.module,
                  border: active ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.05)",
                  background: active ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{m}</span>
                  <span
                    style={{
                      ...styles.dot,
                      background: statusColor(info.status),
                    }}
                  />
                </div>

                <div style={styles.moduleTask}>{info.task || "idle"}</div>
              </div>
            );
          })}
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>Command Console</div>

          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Enter command..."
            style={styles.input}
          />

          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Execution details..."
            style={styles.textarea}
          />

          <select
            value={owner}
            onChange={(e) => {
              const v = e.target.value as ModuleName;
              setOwner(v);
              setSelectedModule(v);
            }}
            style={styles.input}
          >
            {modules.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <button style={styles.primary} onClick={executeTask}>
            Execute Task
          </button>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelTitle}>System State</div>

          <div style={styles.systemItem}>
            Current Task: {state.currentTask?.title || "none"}
          </div>

          <div style={styles.systemItem}>
            Owner: {state.currentTask?.owner || "-"}
          </div>

          <div style={styles.divider} />

          <div style={styles.systemItem}>Builder: OK</div>
          <div style={styles.systemItem}>Preview: OK</div>
          <div style={styles.systemItem}>Runtime: OK</div>
        </div>
      </div>

      <div style={styles.terminal}>
        <div style={styles.terminalHeader}>Execution Log</div>

        <div ref={logRef} style={styles.logBox}>
          {logs.map((l, i) => (
            <div key={i} style={styles.logLine}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #0f172a, #020617)",
    color: "#fff",
    padding: 20,
    fontFamily: "Inter, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
  },

  title: { fontSize: 18, fontWeight: 600 },
  meta: { fontSize: 12, color: "#777" },

  headerRight: { display: "flex", gap: 10, alignItems: "center" },

  ok: { color: "#22c55e", fontSize: 12 },

  refresh: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: 6,
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "260px 1fr 300px",
    gap: 20,
  },

  panel: {
    borderRadius: 12,
    padding: 16,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(16px)",
  },

  panelTitle: { marginBottom: 12, fontWeight: 600 },

  module: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    cursor: "pointer",
  },

  moduleTask: { fontSize: 11, color: "#aaa" },

  dot: { width: 8, height: 8, borderRadius: "50%" },

  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    background: "#111",
    border: "1px solid #222",
    color: "#fff",
    borderRadius: 8,
  },

  textarea: {
    width: "100%",
    height: 90,
    padding: 10,
    marginBottom: 10,
    background: "#111",
    border: "1px solid #222",
    color: "#fff",
    borderRadius: 8,
  },

  primary: {
    width: "100%",
    padding: 12,
    background: "#2563eb",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
    color: "#fff",
  },

  divider: {
    height: 1,
    background: "#111",
    margin: "12px 0",
  },

  systemItem: {
    marginBottom: 8,
    fontSize: 13,
  },

  terminal: {
    marginTop: 20,
    borderRadius: 12,
    background: "#020617",
    border: "1px solid #111",
    overflow: "hidden",
  },

  terminalHeader: {
    padding: 10,
    borderBottom: "1px solid #111",
    fontSize: 12,
    color: "#888",
  },

  logBox: {
    maxHeight: 200,
    overflowY: "auto",
    padding: 10,
    fontFamily: "monospace",
    fontSize: 12,
  },

  logLine: {
    marginBottom: 4,
    color: "#22c55e",
  },
};
