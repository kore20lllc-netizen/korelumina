import type {
  KnowledgeAcquisitionJob,
} from "./KnowledgeAcquisitionJob.js";

export class KnowledgeAcquisitionJobRegistry {
  private readonly jobs =
    new Map<
      string,
      KnowledgeAcquisitionJob
    >();

  register(
    job: KnowledgeAcquisitionJob,
  ): void {
    if (
      this.jobs.has(
        job.id,
      )
    ) {
      throw new Error(
        `Knowledge acquisition job already registered: ${job.id}`,
      );
    }

    this.jobs.set(
      job.id,
      job,
    );
  }

  get(
    id: string,
  ): KnowledgeAcquisitionJob | undefined {
    return this.jobs.get(
      id,
    );
  }

  list(): KnowledgeAcquisitionJob[] {
    return [
      ...this.jobs.values(),
    ];
  }

  clear(): void {
    this.jobs.clear();
  }
}
