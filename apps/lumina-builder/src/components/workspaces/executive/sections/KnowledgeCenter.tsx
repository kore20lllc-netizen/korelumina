import { BookMarked, Building2, Hourglass, Landmark, Library, Sparkles, type LucideIcon } from "lucide-react";

import { ExecutiveSection, ExecutiveTile } from "../shared/ExecutiveSection";
import { composeKnowledgeCategories } from "../state/executiveRecords";
import { useExecutiveOffice } from "../state/useExecutiveOffice";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Canon and Constitution": Landmark,
  "Architecture and governance": Building2,
  "Business and domain": BookMarked,
  "Learning Records": Sparkles,
  "Awaiting review": Hourglass,
};

/* EW-3: wired. Canonical knowledge grouped by the document it came from. */
export function KnowledgeCenter() {
  const knowledgeCategories = composeKnowledgeCategories(useExecutiveOffice());

  return (
    <ExecutiveSection
      id="executive-knowledge"
      icon={Library}
      iconState="healthy"
      eyebrow="Knowledge Center"
      title="Knowledge as engineering intelligence"
      description="Architecture, specifications, decisions, lessons, and canonical knowledge the Chief Agent reasons with. Full governance lives in Knowledge Operations."
      wiring="live"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {knowledgeCategories.map((category) => (
          <ExecutiveTile
            key={category.label}
            label={category.label}
            value={category.count ?? "—"}
            detail={category.detail}
            icon={CATEGORY_ICONS[category.label]}
            tone={category.label === "Awaiting review" ? (category.count ? "warning" : "healthy") : category.label === "Learning Records" ? "active" : "healthy"}
          />
        ))}
      </div>
    </ExecutiveSection>
  );
}
