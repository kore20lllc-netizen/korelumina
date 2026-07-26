import type { SVGProps } from "react";

import type { ExecutiveOperationIcon } from "./executiveOperations";

type IconProps = SVGProps<SVGSVGElement>;

function ExecutiveIcon({
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function RuntimeIcon(props: IconProps) {
  return (
    <ExecutiveIcon {...props}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 5v14M5 12h14" />
    </ExecutiveIcon>
  );
}

export function CompilerIcon(props: IconProps) {
  return (
    <ExecutiveIcon {...props}>
      <path d="M7 7h10v10H7z" />
      <path d="M10 10h4v4h-4z" />
    </ExecutiveIcon>
  );
}

export function RepositoryIcon(props: IconProps) {
  return (
    <ExecutiveIcon {...props}>
      <path d="M8 6h8v12H8z" />
      <path d="M8 10h8M12 6v12" />
    </ExecutiveIcon>
  );
}

export function IntelligenceIcon(props: IconProps) {
  return (
    <ExecutiveIcon {...props}>
      <path d="M12 4l6 4v8l-6 4-6-4V8z" />
      <path d="M9.5 12h5" />
    </ExecutiveIcon>
  );
}

export function KnowledgeIcon(props: IconProps) {
  return (
    <ExecutiveIcon {...props}>
      <path d="M6 8c0-1.5 1.5-3 6-3s6 1.5 6 3-1.5 3-6 3-6-1.5-6-3z" />
      <path d="M6 8v8c0 1.5 1.5 3 6 3s6-1.5 6-3V8" />
    </ExecutiveIcon>
  );
}

const ICONS = {
  runtime: RuntimeIcon,
  compiler: CompilerIcon,
  repository: RepositoryIcon,
  intelligence: IntelligenceIcon,
  knowledge: KnowledgeIcon,
} satisfies Record<
  ExecutiveOperationIcon,
  React.ComponentType<IconProps>
>;

export function getExecutiveOperationIcon(
  type: ExecutiveOperationIcon,
) {
  return ICONS[type];
}

export const KnowledgeHealthIcon = RuntimeIcon;
export const EvidenceCoverageIcon = KnowledgeIcon;
export const CanonicalKnowledgeIcon = RepositoryIcon;
