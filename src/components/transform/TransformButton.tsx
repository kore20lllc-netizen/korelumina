import { Sparkles } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { cn } from "@/lib/utils";
import { useTransform, type TransformSource } from "@/context/TransformContext";
import type { Project } from "@/context/WorkspaceContext";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { track } from "@/lib/analytics";

interface Props {
  source: TransformSource;
  project?: Project | null;
  detected?: {
    framework: string;
    appType: string;
    pages: number;
    components: number;
    designScore: number;
  } | null;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

/**
 * Premium "Transform App → Website" CTA. Always opens the wizard;
 * gating (Free → upgrade) is handled inside the modal.
 */
export function TransformButton({ source, project = null, detected = null, size = "sm", label = "Transform to Website", className }: Props) {
  const { openTransform } = useTransform();
  if (!isFeatureEnabled("transform_to_website")) return null;
  return (
    <LuminaButton
      variant="primary"
      size={size}
      onClick={() => {
        track("transform.opened", {
          source,
          project_id: project?.id ?? null,
          project_type: project?.type ?? null,
          framework: detected?.framework ?? null,
        });
        openTransform({ source, project, detected });
      }}
      className={cn(
        // luxury gold + royal-blue accent layered over the lumina gradient
        "relative bg-[linear-gradient(135deg,hsl(var(--royal-blue))_0%,hsl(var(--violet))_50%,hsl(var(--gold))_100%)]",
        "shadow-[0_6px_24px_-8px_hsl(var(--gold)/0.55),inset_0_1px_0_hsl(0_0%_100%/0.18)]",
        "hover:shadow-[0_10px_32px_-8px_hsl(var(--gold)/0.7),inset_0_1px_0_hsl(0_0%_100%/0.22)]",
        "hover:brightness-[1.06]",
        className
      )}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {label}
    </LuminaButton>
  );
}