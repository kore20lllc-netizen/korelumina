import type {
  LuminaWorkspaceTheme,
} from "@/components/lumina/theme";

interface LuminaAmbientProps {
  theme?: LuminaWorkspaceTheme | string;
}

const overlays: Record<string, string> = {
  knowledge:
    "absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(94,92,230,.22),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(34,211,238,.16),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,.10),transparent_46%)]",

  engineering:
    "absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(168,85,247,.22),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(244,114,182,.18),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(249,115,22,.12),transparent_46%)]",

  runtime:
    "absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,.20),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(59,130,246,.16),transparent_34%)]",

  ai:
    "absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(192,132,252,.20),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(236,72,153,.18),transparent_34%)]",

  developer:
    "absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(59,130,246,.18),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,.16),transparent_34%)]",

  designer:
    "absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(45,212,191,.20),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,.16),transparent_34%)]",

  admin:
    "absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(244,63,94,.20),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,.16),transparent_34%)]",
};

export function LuminaAmbient({
  theme = "knowledge",
}: LuminaAmbientProps) {
  return (
    <>
      <div
        aria-hidden
        className={overlays[theme] ?? overlays.knowledge}
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(6,8,15,.10),rgba(6,8,15,.52))]"
      />
    </>
  );
}
