module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Runtime Metrics extraction loaded.");

  root.find(j.TSInterfaceDeclaration, {
    id: {
      type: "Identifier",
      name: "RuntimeMetricsResponse",
    },
  }).remove();

  root.find(j.FunctionDeclaration, {
    id: {
      type: "Identifier",
      name: "getRuntimeMetrics",
    },
  }).remove();

  const hasImport =
    root.find(j.ImportDeclaration, {
      source: {
        value: "@/services/runtime/metrics",
      },
    }).size() > 0;

  if (!hasImport) {
    root.get().node.program.body.unshift(
      j.importDeclaration(
        [
          j.importSpecifier(
            j.identifier("getRuntimeMetrics"),
          ),
          j.importSpecifier(
            j.identifier("RuntimeMetricsResponse"),
          ),
        ],
        j.literal(
          "@/services/runtime/metrics",
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
