import {
  Factory,
  GraduationCap,
} from "lucide-react";

import {
  LuminaSegmentedDomainNavigator,
} from "@/components/design-system/lumina";

import {
  useKnowledgeV3Workspace,
} from "../state";

import type {
  KnowledgeV3DomainDefinition,
} from "../state";

const DOMAINS: KnowledgeV3DomainDefinition[] = [
  {
    id: "learning",
    label: "Learning",
    description:
      "Executive education, competency and activation readiness",
  },
  {
    id: "production",
    label: "Production",
    description:
      "Institutional knowledge acquisition and publication pipeline",
  },
];

const DOMAIN_ITEMS = DOMAINS.map(
  (domain) => ({
    ...domain,
    icon:
      domain.id === "learning"
        ? GraduationCap
        : Factory,
    tone:
      domain.id === "learning"
        ? "amber" as const
        : "violet" as const,
  }),
);

export function KnowledgeDomainNavigator() {
  const {
    activeDomain,
    setActiveDomain,
  } = useKnowledgeV3Workspace();

  return (
    <LuminaSegmentedDomainNavigator
      ariaLabel="Knowledge Operations domains"
      groupAriaLabel="Select knowledge workspace"
      items={DOMAIN_ITEMS}
      activeItemId={activeDomain}
      onActiveItemChange={setActiveDomain}
    />
  );
}
