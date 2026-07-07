module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Runtime ManualStop extraction loaded.");

  const names = new Set([
    "MANUAL_RUNTIME_STOP_PREFIX",
    "manuallyStoppedRuntimes",
  ]);

  root.find(j.VariableDeclaration)
    .filter(path =>
      path.value.declarations.some(
        d =>
          d.id.type === "Identifier" &&
          names.has(d.id.name),
      ),
    )
    .remove();

  [
    "manualStopKey",
    "markRuntimeManuallyStopped",
    "clearRuntimeManuallyStopped",
    "isRuntimeManuallyStopped",
  ].forEach(name => {
    root.find(j.FunctionDeclaration, {
      id: {
        type: "Identifier",
        name,
      },
    }).remove();
  });

  const hasImport =
    root.find(j.ImportDeclaration, {
      source: {
        value: "@/services/runtime/manualStop",
      },
    }).size() > 0;

  if (!hasImport) {
    root.get().node.program.body.unshift(
      j.importDeclaration(
        [
          j.importSpecifier(
            j.identifier("markRuntimeManuallyStopped"),
          ),
          j.importSpecifier(
            j.identifier("clearRuntimeManuallyStopped"),
          ),
          j.importSpecifier(
            j.identifier("isRuntimeManuallyStopped"),
          ),
        ],
        j.literal(
          "@/services/runtime/manualStop",
        ),
      ),
    );
  }

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
