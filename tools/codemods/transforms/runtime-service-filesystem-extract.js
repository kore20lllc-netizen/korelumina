const removeExportedDeclarations =
  require("../framework/removeExportedDeclarations");
const cleanEmptyExports =
  require("../framework/cleanEmptyExports");

module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Runtime Filesystem extraction loaded.");

  removeExportedDeclarations(
    root,
    j,
    [
      "RuntimeFileListResponse",
      "RuntimeFileReadResponse",
      "RuntimeFileWriteResponse",
      "listRuntimeFiles",
      "readRuntimeFile",
      "writeRuntimeFile",
    ],
  );

  const hasImport =
    root.find(j.ImportDeclaration, {
      source: {
        value: "@/services/runtime/filesystem",
      },
    }).size() > 0;

  if (!hasImport) {
    root.get().node.program.body.unshift(
      j.importDeclaration(
        [
          j.importSpecifier(j.identifier("listRuntimeFiles")),
          j.importSpecifier(j.identifier("readRuntimeFile")),
          j.importSpecifier(j.identifier("writeRuntimeFile")),
          j.importSpecifier(j.identifier("RuntimeFileListResponse")),
          j.importSpecifier(j.identifier("RuntimeFileReadResponse")),
          j.importSpecifier(j.identifier("RuntimeFileWriteResponse")),
        ],
        j.literal("@/services/runtime/filesystem"),
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
