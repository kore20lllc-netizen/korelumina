module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Runtime Events extraction loaded.");

  root.find(j.FunctionDeclaration, {
    id: {
      type: "Identifier",
      name: "connectRuntimeEvents",
    },
  }).remove();

  const hasImport =
    root.find(j.ImportDeclaration, {
      source: {
        value: "@/services/runtime/events",
      },
    }).size() > 0;

  if (!hasImport) {
    root.get().node.program.body.unshift(
      j.importDeclaration(
        [
          j.importSpecifier(
            j.identifier("connectRuntimeEvents"),
          ),
        ],
        j.literal(
          "@/services/runtime/events",
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
