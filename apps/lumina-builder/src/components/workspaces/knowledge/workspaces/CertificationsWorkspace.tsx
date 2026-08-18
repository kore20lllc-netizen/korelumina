import {
  BadgeCheck,
  FileCheck2,
} from "lucide-react";

import {
  LuminaWorkspacePanel,
} from "@/components/lumina/workspace";

export function CertificationsWorkspace() {
  return (
    <LuminaWorkspacePanel
      title="Knowledge Certifications"
      subtitle="Verified operational, functional, governance, and build assurance"
      className="min-h-[680px] p-0"
    >
      <div className="grid min-h-[600px] gap-5 p-5 lg:grid-cols-2">
        <section
          className={[
            "flex min-h-[360px] items-center justify-center rounded-[28px] border p-8",
            "[border-color:var(--lumina-border-standard)]",
            "[background:var(--lumina-surface-panel)]",
          ].join(" ")}
        >
          <div className="max-w-sm text-center">
            <BadgeCheck
              className="mx-auto h-12 w-12 text-cyan"
              strokeWidth={1.5}
            />

            <h3 className="mt-5 text-xl font-semibold">
              No certification record published
            </h3>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Certification state will appear when an authoritative certification harness publishes a verified record.
            </p>
          </div>
        </section>

        <section
          className={[
            "rounded-[28px] border p-5",
            "[border-color:var(--lumina-border-standard)]",
            "[background:var(--lumina-surface-compact)]",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <FileCheck2
              className="h-5 w-5 text-violet-200"
              strokeWidth={1.7}
            />

            <div>
              <div className="text-sm font-semibold">
                Required assurance domains
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
                Certification remains evidence-backed and versioned.
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-2">
            {[
              "UI certification",
              "Functional certification",
              "Governance certification",
              "Build certification",
              "Chief Agent consumption readiness",
            ].map((domain) => (
              <div
                key={domain}
                className={[
                  "flex items-center justify-between gap-3 rounded-xl border px-3 py-3",
                  "[border-color:var(--lumina-border-standard)]",
                  "[background:var(--lumina-surface-interactive)]",
                ].join(" ")}
              >
                <span className="text-xs font-medium">
                  {domain}
                </span>

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Not reported
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </LuminaWorkspacePanel>
  );
}

export default CertificationsWorkspace;
