"use client";

type Job = {
  status?: "pending" | "running" | "success" | "failed";
};

type Preview = {
  status?: "running" | "stopped";
};

export default function StatusBadge({
  job,
  preview
}: {
  job: Job | null;
  preview: Preview | null;
}) {
  const health =
    job?.status === "running"
      ? "building"
      : preview?.status === "running"
      ? "preview"
      : job?.status === "failed"
      ? "failed"
      : job?.status === "success"
      ? "success"
      : "idle";

  const map: Record<
    string,
    { label: string; color: string }
  > = {
    idle: { label: "Idle", color: "text-gray-500" },
    building: { label: "Building", color: "text-yellow-500" },
    preview: { label: "Previewing", color: "text-blue-500" },
    success: { label: "Success", color: "text-green-600" },
    failed: { label: "Failed", color: "text-red-600" }
  };

  const status = map[health] ?? map["idle"];

  return (
    <div className={`text-sm font-medium ${status.color}`}>
      {status.label}
    </div>
  );
}
