
import {
  CheckCircle2,
  Shield,
  GitBranch,
  Database,
  RefreshCcw,
  FileCheck,
} from "lucide-react";

const pillars = [
  {
    icon: GitBranch,
    title: "Repository Preservation",
    body:
      "Existing repositories remain yours. KoreLumina works with your code instead of locking you into proprietary formats.",
  },
  {
    icon: RefreshCcw,
    title: "Incremental Modernization",
    body:
      "Transform systems step by step instead of forcing expensive rewrites.",
  },
  {
    icon: Database,
    title: "Infrastructure Portability",
    body:
      "Move between managed and self-hosted infrastructure without rebuilding your application.",
  },
  {
    icon: Shield,
    title: "Governed Delivery",
    body:
      "Role controls, audit visibility, approvals, and operational safeguards built into the platform.",
  },
  {
    icon: FileCheck,
    title: "Production Readiness",
    body:
      "Applications are built with deployment, operations, maintenance, and ownership in mind.",
  },
  {
    icon: CheckCircle2,
    title: "Human Escalation",
    body:
      "Senior engineers are available when AI reaches architectural or implementation limits.",
  },
];

export function DeliveryConfidence() {
  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">
            Delivery Confidence
          </p>

          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">
            Built around outcomes, not demos.
          </h2>

          <p className="text-muted-foreground mt-5 leading-relaxed">
            KoreLumina is designed around the realities of software delivery:
            existing codebases, infrastructure ownership, governance,
            operational responsibility, and long-term maintenance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="glass-panel-landing rounded-2xl p-6"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "var(--gradient-lumina)" }}
              >
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>

              <h3 className="text-lg font-semibold tracking-tight mb-2">
                {title}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
