import { useReveal } from "@/hooks/use-reveal";
import {
  ShieldCheck,
  Lock,
  ClipboardList,
  Rocket,
  Server,
  Users,
} from "lucide-react";

const capabilities = [
  {
    icon: Lock,
    title: "Access Control",
    body: "Role-based permissions, team isolation, workspace boundaries, and administrative controls.",
  },
  {
    icon: ClipboardList,
    title: "Audit Trails",
    body: "Track platform activity, review changes, and maintain operational accountability.",
  },
  {
    icon: Rocket,
    title: "Deployment Governance",
    body: "Approval workflows, release controls, production safeguards, and deployment visibility.",
  },
  {
    icon: Server,
    title: "Infrastructure Control",
    body: "Managed deployment, private deployment, or bring-your-own cloud infrastructure.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance Readiness",
    body: "Security controls, governance policies, operational standards, and review processes.",
  },
  {
    icon: Users,
    title: "Enterprise Support",
    body: "Escalation paths, engineering reviews, architecture guidance, and strategic support.",
  },
];

export function EnterpriseGovernance() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">
            Enterprise Governance
          </p>

          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">
            Enterprise governance built in.
          </h2>

          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            Security, compliance, auditability, and operational control designed
            for production environments.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="glass-panel-landing rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/20"
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
