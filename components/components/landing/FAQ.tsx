import { useReveal } from "@/hooks/use-reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { faq } from "./data";

export function FAQ() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="faq" className="py-24 md:py-32 px-6">
      <div ref={ref} className="max-w-3xl mx-auto opacity-0">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-gold eyebrow-lumina mb-3">FAQ</p>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-royal-blue royal-glow">Questions, answered.</h2>
        </div>
        <div className="glass-panel rounded-2xl px-2 sm:px-6">
          <Accordion type="single" collapsible className="w-full">
            {faq.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-white/10">
                <AccordionTrigger className="text-left text-foreground hover:text-foreground hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
