import {
  Boxes,
  Inbox,
  ListChecks,
  SearchX,
} from "lucide-react";

import {
  LuminaEmptyState,
} from "@/components/lumina/workspace";

type Variant =
  | "projects"
  | "events"
  | "logs"
  | "search";

const CONFIG = {
  projects: {
    icon: <Boxes className="h-10 w-10 text-muted-foreground" />,
    title: "No services yet",
    description:
      "Deploy a project to see it appear in the runtime.",
  },

  events: {
    icon: <Inbox className="h-10 w-10 text-muted-foreground" />,
    title: "No events yet",
    description:
      "Deployments, restarts and alerts will stream in here.",
  },

  logs: {
    icon: (
      <ListChecks className="h-10 w-10 text-muted-foreground" />
    ),
    title: "No log lines match",
    description:
      "Adjust the log level filter to see more output.",
  },

  search: {
    icon: (
      <SearchX className="h-10 w-10 text-muted-foreground" />
    ),
    title: "No matches",
    description:
      "Try a different search term or reset your filters.",
  },
} satisfies Record<
  Variant,
  {
    icon: JSX.Element;
    title: string;
    description: string;
  }
>;

export interface RuntimeEmptyStateProps {
  variant: Variant;
  className?: string;
}

export function RuntimeEmptyState({
  variant,
}: RuntimeEmptyStateProps) {
  const config = CONFIG[variant];

  return (
    <LuminaEmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
    />
  );
}

export default RuntimeEmptyState;
