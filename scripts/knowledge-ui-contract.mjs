import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = process.cwd();

const PRODUCTION_ROOT =
  "apps/lumina-builder/src/components/workspaces/knowledge/production";

const LEARNING_ROOT =
  "apps/lumina-builder/src/components/workspaces/knowledge/learning";

const SHARED_PRESENTATION_FILES = [
  "apps/lumina-builder/src/components/lumina/workspace/primitives/LuminaFlagshipPanel.tsx",
  "apps/lumina-builder/src/components/lumina/workspace/primitives/LuminaFlagshipCard.tsx",
  "apps/lumina-builder/src/components/lumina/workspace/primitives/LuminaFlagshipSurface.tsx",
  "apps/lumina-builder/src/components/design-system/compositions/LuminaExecutiveTitleMetricsComposition.tsx",
  "apps/lumina-builder/src/components/design-system/compositions/LuminaBalancedSplitPanelComposition.tsx",
  "apps/lumina-builder/src/components/design-system/compositions/LuminaPanelHeaderComposition.tsx",
];

const CONTRACT_PATH =
  path.join(
    ROOT,
    "docs/ui-contracts/knowledge-operations-certified-ui.json",
  );

const WRITE_MODE =
  process.argv.includes("--write");

function walkTsx(relativeDirectory) {
  const absoluteDirectory =
    path.join(
      ROOT,
      relativeDirectory,
    );

  if (
    !fs.existsSync(
      absoluteDirectory,
    )
  ) {
    throw new Error(
      `Missing UI directory: ${relativeDirectory}`,
    );
  }

  const result = [];

  function walk(directory) {
    for (
      const entry
      of fs.readdirSync(
        directory,
        {
          withFileTypes:
            true,
        },
      )
    ) {
      const absolute =
        path.join(
          directory,
          entry.name,
        );

      if (
        entry.isDirectory()
      ) {
        walk(
          absolute,
        );

        continue;
      }

      if (
        !entry.isFile() ||
        !entry.name.endsWith(
          ".tsx",
        )
      ) {
        continue;
      }

      result.push(
        path
          .relative(
            ROOT,
            absolute,
          )
          .split(
            path.sep,
          )
          .join("/"),
      );
    }
  }

  walk(
    absoluteDirectory,
  );

  return result.sort();
}

function normalizeWhitespace(
  value,
) {
  return value
    .replace(
      /\r\n/g,
      "\n",
    )
    .replace(
      /[ \t]+/g,
      " ",
    )
    .replace(
      /\n{3,}/g,
      "\n\n",
    )
    .trim();
}

const PRESENTATION_ATTRIBUTES = [
  "className",
  "variant",
  "columns",
  "as",
  "orientation",
  "size",
  "tone",
  "state",
  "layout",
];

function getJsxTagName(
  node,
  sourceFile,
) {
  return node.tagName.getText(
    sourceFile,
  );
}

function getPresentationAttributes(
  attributes,
  sourceFile,
) {
  const result = {};

  for (
    const property
    of attributes.properties
  ) {
    if (
      !ts.isJsxAttribute(
        property,
      )
    ) {
      continue;
    }

    const name =
      property.name.getText(
        sourceFile,
      );

    if (
      !PRESENTATION_ATTRIBUTES.includes(
        name,
      )
    ) {
      continue;
    }

    if (
      !property.initializer
    ) {
      result[name] =
        "true";

      continue;
    }

    result[name] =
      property.initializer
        .getText(
          sourceFile,
        )
        .replace(
          /\s+/g,
          " ",
        )
        .trim();
  }

  return result;
}

function presentationFingerprint(
  relativeFile,
) {
  const absolute =
    path.join(
      ROOT,
      relativeFile,
    );

  if (
    !fs.existsSync(
      absolute,
    )
  ) {
    throw new Error(
      `Missing certified UI file: ${relativeFile}`,
    );
  }

  const source =
    fs.readFileSync(
      absolute,
      "utf8",
    );

  const sourceFile =
    ts.createSourceFile(
      relativeFile,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );

  const presentation = [];

  function visit(
    node,
  ) {
    if (
      ts.isJsxOpeningElement(
        node,
      ) ||
      ts.isJsxSelfClosingElement(
        node,
      )
    ) {
      presentation.push({
        element:
          getJsxTagName(
            node,
            sourceFile,
          ),

        attributes:
          getPresentationAttributes(
            node.attributes,
            sourceFile,
          ),
      });
    }

    ts.forEachChild(
      node,
      visit,
    );
  }

  visit(
    sourceFile,
  );

  const normalized =
    JSON.stringify(
      presentation,
    );

  return {
    sha256:
      crypto
        .createHash(
          "sha256",
        )
        .update(
          normalized,
        )
        .digest(
          "hex",
        ),

    elementCount:
      presentation.length,
  };
}

function createContract() {
  const productionFiles =
    walkTsx(
      PRODUCTION_ROOT,
    );

  const learningFiles =
    walkTsx(
      LEARNING_ROOT,
    );

  const files =
    [
      ...new Set([
        ...productionFiles,
        ...learningFiles,
        ...SHARED_PRESENTATION_FILES,
      ]),
    ].sort();

  const fingerprints = {};

  for (
    const relativeFile
    of files
  ) {
    fingerprints[
      relativeFile
    ] =
      presentationFingerprint(
        relativeFile,
      );
  }

  return {
    schemaVersion:
      1,

    contract:
      "KoreLumina Knowledge Operations + Education Certified UI",

    policy: {
      uiIsContract:
        true,

      certifiedPresentationImmutable:
        true,

      backendMustConformToUi:
        true,

      allowedWithoutRecertification: [
        "data expressions",
        "runtime projections",
        "service wiring",
        "callbacks",
        "state management that does not change certified presentation topology",
        "text values supplied by runtime",
      ],

      requiresVisualRecertification: [
        "JSX hierarchy",
        "Lumina primitive substitution",
        "className changes",
        "layout variants",
        "panel/card geometry",
        "glass/material ownership",
        "spacing",
        "rails",
        "overflow behavior",
        "conditional mounting of certified Education regions",
        "removal or replacement of Educational Progress surfaces",
        "removal or replacement of Competency Posture surfaces",
        "changes to Education workspace presentation topology",
      ],
    },

    generatedFrom:
      "current visually approved green working tree",

    fingerprints,
  };
}

function writeContract() {
  const contract =
    createContract();

  fs.writeFileSync(
    CONTRACT_PATH,
    `${JSON.stringify(
      contract,
      null,
      2,
    )}\n`,
  );

  console.log(
    `PASS: certified Knowledge Operations + Education UI contract locked (${Object.keys(contract.fingerprints).length} files).`,
  );
}

function verifyContract() {
  if (
    !fs.existsSync(
      CONTRACT_PATH,
    )
  ) {
    throw new Error(
      [
        "Certified Knowledge Operations UI contract is missing.",
        "Run:",
        "node scripts/knowledge-ui-contract.mjs --write",
      ].join("\n"),
    );
  }

  const expected =
    JSON.parse(
      fs.readFileSync(
        CONTRACT_PATH,
        "utf8",
      ),
    );

  const current =
    createContract();

  const failures = [];

  const expectedFiles =
    Object.keys(
      expected.fingerprints,
    ).sort();

  const currentFiles =
    Object.keys(
      current.fingerprints,
    ).sort();

  const expectedSet =
    new Set(
      expectedFiles,
    );

  const currentSet =
    new Set(
      currentFiles,
    );

  for (
    const file
    of expectedFiles
  ) {
    if (
      !currentSet.has(
        file,
      )
    ) {
      failures.push(
        `${file}: certified UI file removed`,
      );

      continue;
    }

    const before =
      expected
        .fingerprints[
          file
        ];

    const after =
      current
        .fingerprints[
          file
        ];

    if (
      before.sha256 !==
      after.sha256
    ) {
      failures.push(
        [
          `${file}: PRESENTATION CONTRACT CHANGED`,
          `  certified: ${before.sha256}`,
          `  current:   ${after.sha256}`,
          `  elements:  ${before.elementCount} -> ${after.elementCount}`,
        ].join("\n"),
      );
    }
  }

  for (
    const file
    of currentFiles
  ) {
    if (
      !expectedSet.has(
        file,
      )
    ) {
      failures.push(
        `${file}: new Production UI surface requires certification`,
      );
    }
  }

  if (
    failures.length > 0
  ) {
    console.error(
      "\nFAIL: CERTIFIED KNOWLEDGE OPERATIONS UI CONTRACT REGRESSION\n",
    );

    for (
      const failure
      of failures
    ) {
      console.error(
        `- ${failure}`,
      );
    }

    console.error(
      [
        "",
        "UI IS THE CONTRACT.",
        "",
        "Do not regenerate the baseline to bypass this failure.",
        "First visually certify the intentional UI change.",
        "Only after explicit approval run:",
        "",
        "  npm run certify:knowledge-ui-contract",
        "",
      ].join("\n"),
    );

    process.exit(
      1,
    );
  }

  console.log(
    `PASS: certified Knowledge Operations + Education UI contract intact (${expectedFiles.length} files).`,
  );
}

if (
  WRITE_MODE
) {
  writeContract();
} else {
  verifyContract();
}
