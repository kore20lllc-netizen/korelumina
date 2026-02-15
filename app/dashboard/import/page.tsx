"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [repo, setRepo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name || !repo) {
      setError("All fields required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, repo }),
      });

      if (!res.ok) {
        throw new Error("Import failed");
      }

      router.push("/dashboard");
    } catch {
      setError("Failed to import repository");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Import GitHub Project</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 border p-6 rounded"
      >
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <div>
          <label className="block text-sm mb-1">Project Name</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My App"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">GitHub Repo URL</label>
          <input
            className="w-full border px-3 py-2 rounded"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="https://github.com/user/repo.git"
          />
        </div>

        <button
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? "Importing..." : "Import"}
        </button>
      </form>
    </div>
  );
}
