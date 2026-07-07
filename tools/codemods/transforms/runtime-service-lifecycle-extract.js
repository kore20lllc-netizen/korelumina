module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Runtime Lifecycle extraction loaded.");

  const names = new Set([
    "normalizeRuntimeUrl",
    "normalizeRuntimePayload",
    "getRuntimeStatus",
    "getRuntime",
    "startRuntime",
    "stopRuntime",
    "restartRuntime",
  ]);

  root.find(j.FunctionDeclaration)
    .filter(path =>
      path.value.id &&
      names.has(path.value.id.name)
    )
    .remove();

  const hasImport =
    root.find(j.ImportDeclaration, {
      source: {
        value: "@/services/runtime/lifecycle",
      },
    }).size() > 0;

  if (!hasImport) {
    root.get().node.program.body.unshift(
      j.importDeclaration(
        [
          j.importSpecifier(j.identifier("getRuntimeStatus")),
          j.importSpecifier(j.identifier("getRuntime")),
          j.importSpecifier(j.identifier("startRuntime")),
          j.importSpecifier(j.identifier("stopRuntime")),
          j.importSpecifier(j.identifier("restartRuntime")),
        ],
        j.literal("@/services/runtime/lifecycle"),
      ),
    );
  }

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
