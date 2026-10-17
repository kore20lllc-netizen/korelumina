/*
 * npm run education:resolve-authority -- --list
 * npm run education:resolve-authority -- \
 *   --artifact <id> --role <LEARNING_ROLE> \
 *   --reviewer <human-review:id> --reason "<why>" [--confirm]
 *
 * Records a human educational authority decision against the current
 * valid Day-0 Genesis certification. Without --confirm it only
 * previews. See EducationalAuthorityResolutionCommand.ts.
 */

import {
  existsSync,
} from "node:fs";

import path from "node:path";

import {
  fileURLToPath,
} from "node:url";

import {
  parseArgs,
} from "node:util";


const repositoryRoot =
  path.resolve(
    path.dirname(
      fileURLToPath(
        import.meta.url,
      ),
    ),
    "../../../../..",
  );

const environmentFile =
  path.join(
    repositoryRoot,
    ".env.local",
  );

if (
  existsSync(
    environmentFile,
  )
) {
  process.loadEnvFile(
    environmentFile,
  );
}


const {
  values,
} = parseArgs({
  options: {
    artifact: {
      type:
        "string",
    },
    role: {
      type:
        "string",
    },
    reviewer: {
      type:
        "string",
    },
    reason: {
      type:
        "string",
    },
    confirm: {
      type:
        "boolean",
      default:
        false,
    },
    list: {
      type:
        "boolean",
      default:
        false,
    },
  },
  strict:
    true,
});


const runtime =
  await import(
    "../../index.js"
  );

const {
  FileEducationalAuthorityResolutionStore,
} = await import(
  "../EducationalAuthorityResolutionPersistence.js"
);

const {
  CanonicalKnowledgeStore,
} = await import(
  "../../canonical-knowledge/index.js"
);

const {
  EDUCATIONAL_LEARNING_ROLES,
  runEducationalAuthorityResolutionCommand,
} = await import(
  "../EducationalAuthorityResolutionCommand.js"
);


const canonical =
  new CanonicalKnowledgeStore();

const store =
  new FileEducationalAuthorityResolutionStore();


function readCorpus() {
  const projection =
    runtime
      .runtimeEducationalCorpusService
      .read();

  return {
    state:
      projection.state,

    assessments:
      projection.sourceContract
        ?.assessments ??
      [],

    unresolvedArtifactIds:
      projection.sourceContract
        ?.unresolvedArtifactIds ??
      [],
  };
}


function readDayZero() {
  const projection =
    runtime
      .runtimeGenesisDayZeroCertificationService
      .read();

  return {
    state:
      projection.state,

    certificationId:
      projection.certification
        ?.certificationId ??
      null,
  };
}


function titleOf(
  artifactId:
    string,
): string | null {
  return (
    canonical.get(
      artifactId,
    )
      ?.title ??
    null
  );
}


function line(
  label:
    string,

  value:
    string,
): void {
  console.log(
    `  ${label.padEnd(14)} ${value}`,
  );
}


if (
  values.list
) {
  const dayZero =
    readDayZero();

  const corpus =
    readCorpus();

  console.log(
    "\nEducational Corpus authority review",
  );

  line(
    "Day-0",
    dayZero.state,
  );

  line(
    "Corpus",
    corpus.state,
  );

  line(
    "Awaiting",
    String(
      corpus.unresolvedArtifactIds.length,
    ),
  );

  for (
    const artifactId of
    corpus.unresolvedArtifactIds
  ) {
    console.log(
      `\n  - ${titleOf(artifactId) ?? "(untitled)"}\n    ${artifactId}`,
    );
  }

  console.log(
    `\nLearning roles: ${EDUCATIONAL_LEARNING_ROLES.join(", ")}\n`,
  );

  process.exit(
    0,
  );
}


const outcome =
  runEducationalAuthorityResolutionCommand(
    {
      artifactId:
        values.artifact ??
        "",
      learningRole:
        values.role ??
        "",
      reviewerId:
        values.reviewer ??
        "",
      reason:
        values.reason ??
        "",
      confirm:
        values.confirm,
    },
    {
      readDayZero,
      readCorpus,
      save:
        resolution =>
          store.save(
            resolution,
          ),
      titleOf,
      now:
        () =>
          Date.now(),
    },
  );


if (
  outcome.status ===
    "REFUSED"
) {
  console.error(
    `\nRefused: ${outcome.reason}\nNothing was recorded.\n`,
  );

  process.exit(
    1,
  );
}


console.log(
  outcome.status ===
    "PREVIEW"
    ? "\nPreview (nothing recorded; add --confirm to record)"
    : "\nRecorded",
);

line(
  "Item",
  outcome.title ??
    outcome.resolution.artifactId,
);

line(
  "Learning role",
  outcome.resolution.learningRole,
);

line(
  "Reviewer",
  outcome.resolution.reviewerId,
);

line(
  "Reason",
  outcome.resolution.reason,
);

line(
  "Day-0",
  outcome.resolution.dayZeroCertificationId,
);

line(
  "Corpus before",
  `${outcome.before.state}, ${outcome.before.unresolvedArtifactIds.length} awaiting review`,
);

if (
  outcome.status ===
    "RECORDED"
) {
  line(
    "Corpus after",
    `${outcome.after.state}, ${outcome.after.unresolvedArtifactIds.length} awaiting review`,
  );

  line(
    "Resolution",
    outcome.resolution.resolutionId,
  );
}

console.log(
  "",
);

process.exit(
  0,
);
