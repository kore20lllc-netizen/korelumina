import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const PRODUCTION_ROOT =
  "apps/lumina-builder/src/components/workspaces/knowledge/production";

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

function extractBalanced(
  source,
  start,
  open,
  close,
) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (
    let index = start;
    index < source.length;
    index += 1
  ) {
    const char =
      source[index];

    if (
      quote
    ) {
      if (
        escaped
      ) {
        escaped = false;
        continue;
      }

      if (
        char === "\\"
      ) {
        escaped = true;
        continue;
      }

      if (
        char === quote
      ) {
        quote = null;
      }

      continue;
    }

    if (
      char === '"' ||
      char === "'" ||
      char === "`"
    ) {
      quote = char;
      continue;
    }

    if (
      char === open
    ) {
      depth += 1;
      continue;
    }

    if (
      char === close
    ) {
      depth -= 1;

      if (
        depth === 0
      ) {
        return source.slice(
          start,
          index + 1,
        );
      }
    }
  }

  throw new Error(
    `Unbalanced ${open}${close} expression`,
  );
}

function extractAttribute(
  tag,
  name,
) {
  const matcher =
    new RegExp(
      `\\b${name}\\s*=\\s*`,
    );

  const match =
    matcher.exec(
      tag,
    );

  if (
    !match
  ) {
    return null;
  }

  const start =
    match.index +
    match[0].length;

  const first =
    tag[start];

  if (
    first === '"' ||
    first === "'"
  ) {
    const end =
      tag.indexOf(
        first,
        start + 1,
      );

    if (
      end === -1
    ) {
      return null;
    }

    return normalizeWhitespace(
      tag.slice(
        start,
        end + 1,
      ),
    );
  }

  if (
    first === "{"
  ) {
    return normalizeWhitespace(
      extractBalanced(
        tag,
        start,
        "{",
        "}",
      ),
    );
  }

  return null;
}

function extractOpeningTags(
  source,
) {
  const tags = [];

  let index = 0;

  while (
    index < source.length
  ) {
    const start =
      source.indexOf(
        "<",
        index,
      );

    if (
      start === -1
    ) {
      break;
    }

    const next =
      source[start + 1];

    if (
      next === "/" ||
      next === "!" ||
      next === ">"
    ) {
      index =
        start + 1;

      continue;
    }

    if (
      !/[A-Za-z]/.test(
        next ?? "",
      )
    ) {
      index =
        start + 1;

      continue;
    }

    let cursor =
      start + 1;

    while (
      cursor <
        source.length &&
      /[A-Za-z0-9_.:-]/.test(
        source[cursor],
      )
    ) {
      cursor += 1;
    }

    const name =
      source.slice(
        start + 1,
        cursor,
      );

    let braceDepth = 0;
    let quote = null;
    let escaped = false;
    let end = cursor;

    for (
      ;
      end < source.length;
      end += 1
    ) {
      const char =
        source[end];

      if (
        quote
      ) {
        if (
          escaped
        ) {
          escaped = false;
          continue;
        }

        if (
          char === "\\"
        ) {
          escaped = true;
          continue;
        }

        if (
          char === quote
        ) {
          quote = null;
        }

        continue;
      }

      if (
        char === '"' ||
        char === "'" ||
        char === "`"
      ) {
        quote = char;
        continue;
      }

      if (
        char === "{"
      ) {
        braceDepth += 1;
        continue;
      }

      if (
        char === "}"
      ) {
        braceDepth -= 1;
        continue;
      }

      if (
        char === ">" &&
        braceDepth === 0
      ) {
        break;
      }
    }

    if (
      end >= source.length
    ) {
      break;
    }

    tags.push({
      name,
      source:
        source.slice(
          start,
          end + 1,
        ),
    });

    index =
      end + 1;
  }

  return tags;
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

  const tags =
    extractOpeningTags(
      source,
    );

  const presentation =
    tags.map(
      (
        {
          name,
          source:
            tagSource,
        },
      ) => {
        const attributes = {};

        for (
          const attribute
          of PRESENTATION_ATTRIBUTES
        ) {
          const value =
            extractAttribute(
              tagSource,
              attribute,
            );

          if (
            value !== null
          ) {
            attributes[
              attribute
            ] = value;
          }
        }

        return {
          element:
            name,
          attributes,
        };
      },
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

  const files =
    [
      ...new Set([
        ...productionFiles,
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
      "KoreLumina Knowledge Operations Certified UI",

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
        "state management",
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
    `PASS: certified Knowledge Operations UI contract locked (${Object.keys(contract.fingerprints).length} files).`,
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
    `PASS: certified Knowledge Operations UI contract intact (${expectedFiles.length} files).`,
  );
}

if (
  WRITE_MODE
) {
  writeContract();
} else {
  verifyContract();
}
