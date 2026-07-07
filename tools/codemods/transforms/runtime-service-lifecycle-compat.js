module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const names = new Set([
    "getRuntimeStatus",
    "getRuntime",
    "startRuntime",
    "stopRuntime",
    "restartRuntime",
  ]);

  root.find(j.ImportDeclaration, {
    source: {
      value: "@/services/runtime/lifecycle",
    },
  }).forEach(path => {
    const kept = [];
    const exported = [];

    for (const spec of path.value.specifiers || []) {
      if (
        spec.type === "ImportSpecifier" &&
        names.has(spec.imported.name)
      ) {
        exported.push(
          j.exportSpecifier(
            j.identifier(spec.imported.name),
            j.identifier(spec.imported.name),
          ),
        );
      } else {
        kept.push(spec);
      }
    }

    if (kept.length) {
      path.value.specifiers = kept;
    } else {
      j(path).remove();
    }

    if (exported.length) {
      root.get().node.program.body.unshift(
        j.exportNamedDeclaration(
          null,
          exported,
          j.literal("@/services/runtime/lifecycle"),
        ),
      );
    }
  });

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
