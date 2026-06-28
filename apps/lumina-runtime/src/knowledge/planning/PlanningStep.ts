export interface PlanningStep {
  id: string;
  title: string;
  description: string;
  rationale: string;
  dependsOnStepIds: string[];
  relatedFindingIds: string[];
  relatedRecommendationIds: string[];
}
