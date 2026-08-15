import {
  advanceKnowledgeManufacturingRun,
  createKnowledgeManufacturingRun,
  linkKnowledgeManufacturingCanonicalItems,
  linkKnowledgeManufacturingPackage,
  routeKnowledgeManufacturingRun,
} from "./KnowledgeManufacturingRun.js";

import type {
  AdvanceKnowledgeManufacturingRunInput,
  CreateKnowledgeManufacturingRunInput,
  KnowledgeManufacturingRun,
  RouteKnowledgeManufacturingRunInput,
} from "./KnowledgeManufacturingRun.js";

import {
  listKnowledgeManufacturingRuns,
  loadKnowledgeManufacturingRun,
  saveKnowledgeManufacturingRun,
} from "./KnowledgeManufacturingRunStore.js";

export class KnowledgeManufacturingRunService {
  create(
    input:
      CreateKnowledgeManufacturingRunInput,
  ): KnowledgeManufacturingRun {
    const existing =
      loadKnowledgeManufacturingRun(
        input.id,
      );

    if (
      existing
    ) {
      throw new Error(
        "knowledge_manufacturing_run_already_exists",
      );
    }

    const run =
      createKnowledgeManufacturingRun(
        input,
      );

    saveKnowledgeManufacturingRun(
      run,
    );

    return run;
  }

  get(
    id:
      string,
  ): KnowledgeManufacturingRun | undefined {
    return (
      loadKnowledgeManufacturingRun(
        id,
      ) ??
      undefined
    );
  }

  list():
    KnowledgeManufacturingRun[] {
    return listKnowledgeManufacturingRuns()
      .sort(
        (
          left,
          right,
        ) =>
          right.updatedAt -
          left.updatedAt,
      );
  }

  findByPackageId(
    packageId:
      string,
  ): KnowledgeManufacturingRun | undefined {
    const normalized =
      packageId.trim();

    if (
      !normalized
    ) {
      return undefined;
    }

    return this.list().find(
      (run) =>
        run.packageId ===
        normalized,
    );
  }

  route(
    id:
      string,

    input:
      RouteKnowledgeManufacturingRunInput,
  ): KnowledgeManufacturingRun {
    const current =
      this.get(
        id,
      );

    if (
      !current
    ) {
      throw new Error(
        "knowledge_manufacturing_run_not_found",
      );
    }

    const updated =
      routeKnowledgeManufacturingRun(
        current,
        input,
      );

    saveKnowledgeManufacturingRun(
      updated,
    );

    return updated;
  }

  advance(
    id:
      string,

    input:
      AdvanceKnowledgeManufacturingRunInput,
  ): KnowledgeManufacturingRun {
    const current =
      this.get(
        id,
      );

    if (
      !current
    ) {
      throw new Error(
        "knowledge_manufacturing_run_not_found",
      );
    }

    const updated =
      advanceKnowledgeManufacturingRun(
        current,
        input,
      );

    saveKnowledgeManufacturingRun(
      updated,
    );

    return updated;
  }

  linkPackage(
    id:
      string,

    packageId:
      string,

    at?:
      number,
  ): KnowledgeManufacturingRun {
    const current =
      this.get(
        id,
      );

    if (
      !current
    ) {
      throw new Error(
        "knowledge_manufacturing_run_not_found",
      );
    }

    const updated =
      linkKnowledgeManufacturingPackage(
        current,
        packageId,
        at,
      );

    saveKnowledgeManufacturingRun(
      updated,
    );

    return updated;
  }

  linkCanonicalKnowledge(
    id:
      string,

    canonicalKnowledgeIds:
      readonly string[],

    at?:
      number,
  ): KnowledgeManufacturingRun {
    const current =
      this.get(
        id,
      );

    if (
      !current
    ) {
      throw new Error(
        "knowledge_manufacturing_run_not_found",
      );
    }

    const updated =
      linkKnowledgeManufacturingCanonicalItems(
        current,
        canonicalKnowledgeIds,
        at,
      );

    saveKnowledgeManufacturingRun(
      updated,
    );

    return updated;
  }
}
