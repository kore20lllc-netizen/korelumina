"use client";

type Health = "idle" | "building" | "previewing" | "error" | "ready";

export default function StatusBadge({ health }: { health: Health }) {
  const map: Record<Health, { label: string; color: string }> = {
    idle: { label: "Idle", color: "bg-gray-500" },
    building: { label: "Building", color: "bg-yellow-500 animate-pulse" },
    previewing: { label: "Previewing", color: "bg-blue-500 animate-pulse" },
    error: { label: "Error", color: "bg-red-600" },
    ready: { label: "Ready", color: "bg-green-600" },
  };

  const { label, color } = map[health];

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
