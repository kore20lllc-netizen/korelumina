export const semanticStateLanguage = {
  category: {
    neutral: {
      label: "Neutral",
      tone: "neutral",
      emphasis: "subtle",
    },

    informational: {
      label: "Informational",
      tone: "informational",
      emphasis: "standard",
    },

    active: {
      label: "Active",
      tone: "active",
      emphasis: "standard",
    },

    positive: {
      label: "Positive",
      tone: "positive",
      emphasis: "standard",
    },

    warning: {
      label: "Warning",
      tone: "warning",
      emphasis: "prominent",
    },

    critical: {
      label: "Critical",
      tone: "critical",
      emphasis: "prominent",
    },

    restricted: {
      label: "Restricted",
      tone: "violet",
      emphasis: "standard",
    },

    dormant: {
      label: "Dormant",
      tone: "neutral",
      emphasis: "subtle",
    },
  },

  posture: {
    idle: {
      category: "neutral",
      motion: "none",
      affordance: "passive",
    },

    queued: {
      category: "informational",
      motion: "pulse",
      affordance: "passive",
    },

    processing: {
      category: "active",
      motion: "pulse",
      affordance: "active",
    },

    waiting: {
      category: "warning",
      motion: "none",
      affordance: "passive",
    },

    blocked: {
      category: "critical",
      motion: "none",
      affordance: "attention",
    },

    failed: {
      category: "critical",
      motion: "none",
      affordance: "attention",
    },

    review: {
      category: "warning",
      motion: "none",
      affordance: "attention",
    },

    healthy: {
      category: "positive",
      motion: "none",
      affordance: "passive",
    },

    approved: {
      category: "positive",
      motion: "none",
      affordance: "passive",
    },

    published: {
      category: "active",
      motion: "none",
      affordance: "active",
    },

    superseded: {
      category: "restricted",
      motion: "none",
      affordance: "passive",
    },

    archived: {
      category: "dormant",
      motion: "none",
      affordance: "passive",
    },
  },
} as const;

export type SemanticStateLanguage =
  typeof semanticStateLanguage;

export type SemanticStateCategory =
  keyof typeof semanticStateLanguage.category;

export type SemanticStatePosture =
  keyof typeof semanticStateLanguage.posture;
