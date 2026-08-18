import assert from "node:assert/strict";
import test from "node:test";

import {
  certifiedEducationalCoverageRequirements,
  coverageRequirementsForModule,
  measureEducationalCoverage,
} from "../measurement/index.js";

import {
  certifiedEducationalModules,
} from "../CertifiedEducationalCurriculum.js";

const GOVERNED_SOURCE_MODULES =
  new Set([
    "constitutional-literacy",
    "knowledge-governance",
    "operational-boundaries",
  ]);

test(
  "every certified Education module has measurable requirements",
  () => {
    assert.equal(
      certifiedEducationalModules.length,
      5,
    );

    for (
      const module
      of certifiedEducationalModules
    ) {
      const requirements =
        coverageRequirementsForModule(
          module.id,
        );

      assert.ok(
        requirements.length >
          0,
        `${module.id} has no measurable curriculum requirements`,
      );
    }
  },
);

test(
  "governed document modules resolve through source identity rather than presentation classification",
  () => {
    for (
      const definition
      of certifiedEducationalCoverageRequirements
    ) {
      if (
        !GOVERNED_SOURCE_MODULES.has(
          definition.moduleId,
        )
      ) {
        continue;
      }

      for (
        const requirement
        of definition.requirements
      ) {
        assert.ok(
          requirement.match.sourceRefs &&
          requirement.match.sourceRefs.length >
            0,
          `${definition.moduleId}/${requirement.id} must declare governed sourceRefs`,
        );

        assert.equal(
          requirement.match.titleIncludes,
          undefined,
          `${definition.moduleId}/${requirement.id} must not use title matching`,
        );

        assert.equal(
          requirement.match.kinds,
          undefined,
          `${definition.moduleId}/${requirement.id} must not use kind matching`,
        );

        assert.equal(
          requirement.match.categories,
          undefined,
          `${definition.moduleId}/${requirement.id} must not use category matching`,
        );
      }
    }
  },
);

test(
  "certified curriculum contains no authored completion percentages",
  () => {
    for (
      const module
      of certifiedEducationalModules
    ) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(
          module,
          "completion",
        ),
        false,
        `${module.id} must not contain an authored completion percentage`,
      );

      assert.equal(
        Object.prototype.hasOwnProperty.call(
          module,
          "status",
        ),
        false,
        `${module.id} must not contain an authored progress status`,
      );
    }
  },
);

test(
  "zero admitted curriculum always produces zero measured coverage",
  () => {
    for (
      const module
      of certifiedEducationalModules
    ) {
      const requirements =
        coverageRequirementsForModule(
          module.id,
        );

      const result =
        measureEducationalCoverage(
          [],
          requirements,
        );

      assert.equal(
        result.completion,
        0,
      );

      assert.equal(
        result.satisfiedCount,
        0,
      );

      assert.equal(
        result.requirementCount,
        requirements.length,
      );

      assert.equal(
        result.measurementVersion,
        "education-coverage-v1",
      );
    }
  },
);

test(
  "all certified requirement ids are globally unique",
  () => {
    const ids =
      certifiedEducationalCoverageRequirements.flatMap(
        (definition) =>
          definition.requirements.map(
            (requirement) =>
              requirement.id,
          ),
      );

    assert.equal(
      new Set(
        ids,
      ).size,
      ids.length,
      "Education requirement identity collision detected",
    );
  },
);
