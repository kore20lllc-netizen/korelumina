"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import BuilderInner from "./BuilderInner";

export default function BuilderClient() {
  const searchParams = useSearchParams();
  const projectId =
    searchParams.get("projectId");

  const [repoUrl, setRepoUrl] =
    useState("");

  const [importing, setImporting] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleImport() {
    if (!repoUrl.trim()) {
      return;
    }

    try {
      setImporting(true);
      setError("");

      const res = await fetch(
        "/api/dev/import",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            repoUrl,
          }),
        },
      );

      const data =
        await res.json();

      if (!data.ok) {
        throw new Error(
          data.error ||
            "Import failed",
        );
      }

      window.location.href =
        data.builderUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Import failed",
      );
    } finally {
      setImporting(false);
    }
  }

  if (!projectId) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          color: "white",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 700,
            background: "#0f172a",
            border:
              "1px solid #1e293b",
            borderRadius: 16,
            padding: 32,
          }}
        >
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Import GitHub Repository
          </h1>

          <p
            style={{
              color: "#94a3b8",
              marginBottom: 24,
            }}
          >
            Paste any public GitHub
            repository URL to import,
            analyze, and continue
            building inside
            KoreLumina.
          </p>

          <input
            type="text"
            value={repoUrl}
            onChange={(e) =>
              setRepoUrl(
                e.target.value,
              )
            }
            placeholder="https://github.com/owner/repo"
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              border:
                "1px solid #334155",
              background:
                "#020617",
              color: "white",
              marginBottom: 16,
              outline: "none",
            }}
          />

          <button
            onClick={handleImport}
            disabled={importing}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              background:
                "linear-gradient(135deg,#3b82f6,#2563eb)",
              color: "white",
            }}
          >
            {importing
              ? "Importing..."
              : "Import Repository"}
          </button>

          {error && (
            <div
              style={{
                marginTop: 16,
                color: "#f87171",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <BuilderInner
      projectId={projectId}
    />
  );
}
