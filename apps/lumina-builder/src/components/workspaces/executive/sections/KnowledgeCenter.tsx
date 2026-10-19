import { BookMarked, Building2, Hourglass, Landmark, Library, Sparkles, type LucideIcon } from "lucide-react";

import { knowledgeCategories } from "../design/executiveDesignPreview";
import { ExecutiveSection, ExecutiveTile } from "../shared/ExecutiveSection";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Canon and Constitution": Landmark,
  Architecture: Building2,
  "Business and domain": BookMarked,
  "Learning Records": Sparkles,
  "Awaiting review": Hourglass,
};

export function KnowledgeCenter() {
  return (
    <ExecutiveSection
      id="executive-knowledge"
      icon={Library}
      iconState="healthy"
      eyebrow="Knowledge Center"
      title="Knowledge as engineering intelligence"
      description="Architecture, specifications, decisions, lessons, and canonical knowledge the Chief Agent reasons with. Full governance lives in Knowledge Operations."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {knowledgeCategories.map((category) => (
          <ExecutiveTile
            key={category.label}
            label={category.label}
            value={category.count}
            detail={category.detail}
            icon={CATEGORY_ICONS[category.label]}
            tone={category.label === "Awaiting review" ? "warning" : category.label === "Learning Records" ? "active" : "healthy"}
          />
        ))}
      </div>
    </ExecutiveSection>
  );
}
