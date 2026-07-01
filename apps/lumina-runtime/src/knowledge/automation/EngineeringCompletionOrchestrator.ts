export interface EngineeringCompletionValidation {
  name: string;

  passed: boolean;

  details?: string;
}

export interface EngineeringCompletionInput {
  phase: number;

  title: string;

  commit: string;

  tag?: string;

  adrIds?: string[];

  milestoneId?: string;

  validation: EngineeringCompletionValidation[];

  notes?: string[];
}

export interface EngineeringCompletionReport {
  phase: number;

  title: string;

  completed: boolean;

  commit: string;

  tag?: string;

  adrIds: string[];

  milestoneId?: string;

  validation: EngineeringCompletionValidation[];

  generatedAt: number;
}

export function completeEngineeringPhase(
  input: EngineeringCompletionInput,
): EngineeringCompletionReport {
  const completed =
    input.validation.every(
      (item) => item.passed,
    );

  return {
    phase:
      input.phase,
    title:
      input.title,
    completed,
    commit:
      input.commit,
    tag:
      input.tag,
    adrIds:
      input.adrIds ?? [],
    milestoneId:
      input.milestoneId,
    validation:
      input.validation,
    generatedAt:
      Date.now(),
  };
}
