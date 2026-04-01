"use client";

import { useState } from "react";

const modules = [
  "builder-core",
  "ai-planner-diff",
  "repo-import",
  "runtime-preview",
  "production-hardening",
];

export default function MasterOS() {
  const [selectedModule, setSelectedModule] = useState("builder-core");

  return (
    <div style={styles.container}>
      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div>Project: repo-test</div>
        <div>Branch: stable</div>
        <div>Tag: ai-ide-core-stable</div>
        <div style={styles.green}>Build: OK</div>
        <div style={styles.green}>Preview: OK</div>
      </div>

      <div style={styles.main}>
        {/* LEFT: MODULES */}
        <div style={styles.panel}>
          <h3>Modules</h3>
          {modules.map((m) => (
            <div
              key={m}
              onClick={() => setSelectedModule(m)}
              style={{
                ...styles.moduleItem,
                background:
                  selectedModule === m ? "#1f2937" : "transparent",
              }}
            >
              <span>{m}</span>
              <span style={styles.greenDot}></span>
            </div>
          ))}
        </div>

        {/* CENTER: TASK ROUTER */}
        <div style={styles.panel}>
          <h3>Task Router</h3>

          <input placeholder="Task title" style={styles.input} />
          <textarea
            placeholder="Task description"
            style={styles.textarea}
          />

          <select
              style={styles.input}
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
            {modules.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <input
            placeholder="Expected outcome"
            style={styles.input}
          />

          <input
            placeholder="Do not touch (comma separated)"
            style={styles.input}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button style={styles.primaryBtn}>Assign</button>
            <button style={styles.secondaryBtn}>Reset</button>
          </div>
        </div>

        {/* RIGHT: SYSTEM STATE */}
        <div style={styles.panel}>
          <h3>System State</h3>

          <div>Build: OK</div>
          <div>Preview: OK</div>
          <div>Editor: OK</div>
          <div>Filetree: OK</div>

          <hr style={styles.hr} />

          <div>Blockers:</div>
          <ul>
            <li>None</li>
          </ul>

          <hr style={styles.hr} />

          <div>Current Task:</div>
          <div>Fix project switching</div>
        </div>
      </div>

      {/* BOTTOM: LOG */}
      <div style={styles.logPanel}>
        <h3>Execution Log</h3>
        <div>• System initialized</div>
        <div>• Builder stable</div>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    minHeight: "100vh",
    background: "#0b0b0b",
    color: "#fff",
    padding: 20,
    fontFamily: "sans-serif",
  },
  topBar: {
    display: "flex",
    gap: 20,
    marginBottom: 20,
    padding: 10,
    background: "#111",
    borderRadius: 8,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "250px 1fr 300px",
    gap: 20,
  },
  panel: {
    background: "#111",
    padding: 15,
    borderRadius: 10,
    border: "1px solid #222",
  },
  moduleItem: {
    padding: 10,
    borderRadius: 6,
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
  },
  greenDot: {
    width: 10,
    height: 10,
    background: "green",
    borderRadius: "50%",
  },
  input: {
    width: "100%",
    padding: 8,
    marginBottom: 10,
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "#fff",
  },
  textarea: {
    width: "100%",
    padding: 8,
    height: 80,
    marginBottom: 10,
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "#fff",
  },
  primaryBtn: {
    padding: "8px 12px",
    background: "#2563eb",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "8px 12px",
    background: "#333",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  logPanel: {
    marginTop: 20,
    background: "#111",
    padding: 15,
    borderRadius: 10,
    border: "1px solid #222",
  },
  hr: {
    borderColor: "#222",
    margin: "10px 0",
  },
  green: {
    color: "#22c55e",
  },
};
