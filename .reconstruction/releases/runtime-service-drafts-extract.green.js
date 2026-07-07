const removeExportedDeclarations =
  require("../framework/removeExportedDeclarations");
const cleanEmptyExports =
  require("../framework/cleanEmptyExports");

module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Runtime Drafts extraction loaded.");

  removeExportedDeclarations(
    root,
    j,
    [
      "RuntimeDraftPatch",
      "RuntimeDraft",
      "RuntimeCreateDraftResponse",
      "RuntimeApplyDraftResponse",
      "createRuntimeDraft",
      "getRuntimeDraft",
      "applyRuntimeDraft",
    ],
  );

  const hasImport =
    root.find(j.ImportDeclaration, {
      source: {
        value: "@/services/runtime/drafts",
      },
    }).size() > 0;

  if (!hasImport) {
    root.get().node.program.body.unshift(
      j.importDeclaration(
        [
          j.importSpecifier(j.identifier("createRuntimeDraft")),
          j.importSpecifier(j.identifier("getRuntimeDraft")),
          j.importSpecifier(j.identifier("applyRuntimeDraft")),
          j.importSpecifier(j.identifier("RuntimeDraftPatch")),
          j.importSpecifier(j.identifier("RuntimeDraft")),
          j.importSpecifier(j.identifier("RuntimeCreateDraftResponse")),
          j.importSpecifier(j.identifier("RuntimeApplyDraftResponse")),
        ],
        j.literal("@/services/runtime/drafts"),
      ),
    );
  }

  return cleanEmptyExports(
    root.toSource({
      quote: "double",
      trailingComma: true,
    }),
  );
};

module.exports.parser = "tsx";
