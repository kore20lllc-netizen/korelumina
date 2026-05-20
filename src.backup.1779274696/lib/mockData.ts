export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  kind?: "info" | "success" | "warn";
}

export const mockNotifications: Notification[] = [
  { id: "n1", title: "Build complete", body: "Aurora Studio shipped to production.", time: "2m", unread: true, kind: "success" },
  { id: "n2", title: "AI execution credit", body: "You have 3 of 5 free executions left.", time: "1h", unread: true, kind: "info" },
  { id: "n3", title: "New template", body: "Premium “Halo SaaS” template is live.", time: "Yesterday", kind: "info" },
];

export interface Template {
  id: string;
  name: string;
  category: "Website" | "Web App" | "Dashboard" | "AI Tool" | "Mobile App";
  tags: string[];
  description: string;
  accent: "violet" | "magenta" | "cyan" | "gold";
}

export const mockTemplates: Template[] = [
  { id: "t1", name: "Halo SaaS",        category: "Web App",   tags: ["auth", "stripe", "marketing"], description: "Production SaaS shell with billing.", accent: "violet" },
  { id: "t2", name: "Pulse Analytics",  category: "Dashboard", tags: ["charts", "kpi"],               description: "Realtime metrics dashboard.",        accent: "cyan" },
  { id: "t3", name: "Aurora Landing",   category: "Website",   tags: ["hero", "pricing"],             description: "Premium landing template.",          accent: "magenta" },
  { id: "t4", name: "Lumen Copilot",    category: "AI Tool",   tags: ["chat", "agents"],              description: "Agent UI starter.",                  accent: "gold" },
  { id: "t5", name: "Atlas Ops",        category: "Dashboard", tags: ["ops", "tables"],               description: "Internal ops console.",              accent: "cyan" },
  { id: "t6", name: "Helix CRM",        category: "Web App",   tags: ["crm", "pipelines"],            description: "Pipeline-first CRM template.",       accent: "violet" },
];

export interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
}

export const mockIntegrations: Integration[] = [
  { id: "github",   name: "GitHub",   description: "Sync repositories and pull requests.", connected: true  },
  { id: "supabase", name: "Supabase", description: "Database, auth, storage.",              connected: false },
  { id: "vercel",   name: "Vercel",   description: "Deploy and preview environments.",      connected: true  },
  { id: "stripe",   name: "Stripe",   description: "Subscriptions and one-time payments.",  connected: false },
  { id: "openai",   name: "OpenAI",   description: "Models and embeddings.",                 connected: true  },
];

export const mockUsage = { plan: "free" as const, aiExecutions: 2, aiLimit: 5 };