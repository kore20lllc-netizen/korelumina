"use client";

import { useEffect, useState } from "react";

export default function DiffPanel({
  file,
  newCode,
}: {
  file: string;
  newCode: string;
}) {
  const [oldCode, setOldCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loadingExplain, setLoadingExplain] = useState(false);

  useEffect(() => {
    async function loadOld() {
      try {
        const res = await fetch(
          `/api/dev/fs/read?projectId=repo-test&file=${encodeURIComponent(file)}`
        );

        const text = await res.text();

        let parsed = text;

        if (text && text.trim().startsWith("{")) {
          try {
            const json = JSON.parse(text);
            parsed = json.content || "";
          } catch {}
        }

        setOldCode(parsed || "");
      } catch {
        setOldCode("");
      }
    }

    loadOld();
  }, [file]);

  function highlightDiff(oldStr: string, newStr: string) {
    if (oldStr === newStr) return newStr;

    let result = "";

    for (let i = 0; i < newStr.length; i++) {
      if (newStr[i] !== oldStr[i]) {
        result += `<span style="background:#064e3b;color:#fff">${newStr[i]}</span>`;
      } else {
        result += newStr[i];
      }
    }

    return result;
  }

  async function explainChanges() {
    try {
      setLoadingExplain(true);
      setExplanation("");

      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file,
          oldCode,
          newCode,
        }),
      });

      const data = await res.json().catch(() => ({}));
      setExplanation(data?.text || "No explanation available");
    } catch {
      setExplanation("Explain failed");
    } finally {
      setLoadingExplain(false);
    }
  }

  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");
  const max = Math.max(oldLines.length, newLines.length);

  return (
    <div style={{ fontFamily: "monospace", fontSize: 12 }}>
      {/* Explain button */}
      <div style={{ marginBottom: 10 }}>
        <button
          onClick={explainChanges}
          style={{
            background: "#3b82f6",
            color: "#fff",
            padding: "6px 10px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loadingExplain ? "Explaining..." : "Explain Changes"}
        </button>
      </div>

      {/* Explanation */}
      {explanation && (
        <div
          style={{
            marginBottom: 10,
            padding: 10,
            background: "#020617",
            border: "1px solid #1e293b",
            borderRadius: 8,
            whiteSpace: "pre-wrap",
          }}
        >
          {explanation}
        </div>
      )}

      {/* Diff */}
      {Array.from({ length: max }).map((_, i) => {
        const oldL = oldLines[i] || "";
        const newL = newLines[i] || "";
        const changed = oldL !== newL;

        return (
          <div
            key={i}
            style={{
              display: "flex",
              background: changed ? "#0f172a" : "transparent",
            }}
          >
            <div style={{ width: "50%", padding: 6, opacity: 0.6 }}>
              {oldL}
            </div>

            <div
              style={{ width: "50%", padding: 6 }}
              dangerouslySetInnerHTML={{
                __html: highlightDiff(oldL, newL),
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
