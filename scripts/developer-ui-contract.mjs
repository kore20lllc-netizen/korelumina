import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

/*
 * MS-2026-0011: the Developer workspace UI contract.
 *
 * Same method as the Knowledge Operations, Executive Office and Repo Audit
 * contracts:
 * every TSX surface of the Developer workspace is fingerprinted by its JSX hierarchy and
 * presentation attributes. Data, wiring, callbacks, and text may change
 * freely; a change to what the page looks like fails until the owner
 * approves it visually and runs `npm run certify:developer-ui-contract`.
 *
 * The other contract scripts are left untouched on purpose: each guards
 * its own certified surface.
 */

const ROOT = process.cwd();

const DEVELOPER_ROOTS = [
  "apps/lumina-builder/src/components/workspaces/developer",
  "apps/lumina-builder/src/components/ai",
];

const CONTRACT_PATH =
  path.join(ROOT, "docs/ui-contracts/developer-certified-ui.json");

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
  "wiring",
];

function walkTsx(relativeDirectory) {
  const result = [];
  const absoluteDirectory = path.join(ROOT, relativeDirectory);

  if (!fs.existsSync(absoluteDirectory)) {
    throw new Error(`Missing UI directory: ${relativeDirectory}`);
  }

  (function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
      } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
        result.push(path.relative(ROOT, absolute).split(path.sep).join("/"));
      }
    }
  })(absoluteDirectory);

  return result.sort();
}

function presentationFingerprint(relativeFile) {
  const source = fs.readFileSync(path.join(ROOT, relativeFile), "utf8");
  const sourceFile = ts.createSourceFile(
    relativeFile,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const presentation = [];

  (function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attributes = {};
      for (const property of node.attributes.properties) {
        if (!ts.isJsxAttribute(property)) continue;
        const name = property.name.getText(sourceFile);
        /* Props like gridColumnsClassName style the element just as className does. */
        if (!PRESENTATION_ATTRIBUTES.includes(name) && !name.endsWith("ClassName")) continue;
        attributes[name] = property.initializer
          ? property.initializer.getText(sourceFile).replace(/\s+/g, " ").trim()
          : "true";
      }
      presentation.push({
        element: node.tagName.getText(sourceFile),
        attributes,
      });
    }
    ts.forEachChild(node, visit);
  })(sourceFile);

  return {
    sha256: crypto
      .createHash("sha256")
      .update(JSON.stringify(presentation))
      .digest("hex"),
    elementCount: presentation.length,
  };
}

function createContract() {
  const fingerprints = {};
  for (const root of DEVELOPER_ROOTS) {
    for (const file of walkTsx(root)) {
      fingerprints[file] = presentationFingerprint(file);
    }
  }

  return {
    schemaVersion: 1,
    contract: "KoreLumina Developer workspace Certified UI",
    policy: {
      uiIsContract: true,
      certifiedPresentationImmutable: true,
      backendMustConformToUi: true,
      allowedWithoutRecertification: [
        "data expressions",
        "Runtime reads and writes",
        "service wiring",
        "callbacks",
        "state management that does not change certified presentation topology",
        "text values supplied by runtime",
      ],
      requiresVisualRecertification: [
        "JSX hierarchy",
        "Lumina primitive substitution",
        "className changes",
        "layout and grid arrangement",
        "panel/card geometry",
        "Developer command deck, explorer, editor and its status bar",
        "preview, logs and AI Assist panel",
        "the KoreLumina AI mark (LuminaAIMark)",
                "conditional mounting of sections",
      ],
    },
    generatedFrom: "owner visually approved the Developer workspace (2026-10-23)",
    fingerprints,
  };
}

const WRITE_MODE = process.argv.includes("--write");

if (WRITE_MODE) {
  const contract = createContract();
  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, `${JSON.stringify(contract, null, 2)}\n`);
  console.log(
    `PASS: certified Developer workspace UI contract locked (${Object.keys(contract.fingerprints).length} files).`,
  );
} else {
  if (!fs.existsSync(CONTRACT_PATH)) {
    console.error(
      [
        "FAIL: the Developer workspace UI contract is missing.",
        "After the owner approves Developer workspace visually, run:",
        "  npm run certify:developer-ui-contract",
      ].join("\n"),
    );
    process.exit(1);
  }

  const expected = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8")).fingerprints;
  const current = createContract().fingerprints;
  const failures = [];

  for (const file of Object.keys(expected).sort()) {
    if (!current[file]) {
      failures.push(`${file}: certified UI file removed`);
    } else if (current[file].sha256 !== expected[file].sha256) {
      failures.push(
        [
          `${file}: PRESENTATION CONTRACT CHANGED`,
          `  certified: ${expected[file].sha256}`,
          `  current:   ${current[file].sha256}`,
          `  elements:  ${expected[file].elementCount} -> ${current[file].elementCount}`,
        ].join("\n"),
      );
    }
  }

  for (const file of Object.keys(current).sort()) {
    if (!expected[file]) {
      failures.push(`${file}: new Developer workspace UI surface requires certification`);
    }
  }

  if (failures.length > 0) {
    console.error("\nFAIL: CERTIFIED RUNTIME OPERATIONS UI CONTRACT REGRESSION\n");
    for (const failure of failures) console.error(`- ${failure}`);
    console.error(
      [
        "",
        "UI IS THE CONTRACT.",
        "Do not regenerate the baseline to bypass this failure.",
        "First visually approve the intentional UI change, then run:",
        "",
        "  npm run certify:developer-ui-contract",
        "",
      ].join("\n"),
    );
    process.exit(1);
  }

  console.log(
    `PASS: certified Developer workspace UI contract intact (${Object.keys(expected).length} files).`,
  );
}
