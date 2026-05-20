import { useReveal } from "@/hooks/use-reveal";
import { Check, X } from "lucide-react";
import { comparisonRows, comparisonCols } from "./data";

export function Comparison() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-6xl mx-auto opacity-0">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">How we compare</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-gradient-royal-gold">An OS, not a code generator.</h2>
        </div>
        <div className="glass-panel-landing rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 font-medium text-muted-foreground">Capability</th>
                  {comparisonCols.map((c, i) => (
                    <th key={c} className={`p-4 text-center font-medium ${i === 0 ? "text-gradient-lumina" : "text-muted-foreground"}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((r, idx) => (
                  <tr key={r.feature} className={idx < comparisonRows.length - 1 ? "border-b border-white/5" : ""}>
                    <td className="p-4 text-foreground">{r.feature}</td>
                    {[r.korelumina, r.lovable, r.bolt, r.v0, r.cursor].map((v, i) => (
                      <td key={i} className="p-4 text-center">
                        {v ? <Check className="inline w-4 h-4 text-cyan" /> : <X className="inline w-4 h-4 text-muted-foreground/40" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
