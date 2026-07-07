module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Runtime ManualStop consumer migration loaded.");

  const symbols = new Set([
    "markRuntimeManuallyStopped",
    "clearRuntimeManuallyStopped",
    "isRuntimeManuallyStopped",
  ]);

  // Remove the extracted specifiers from runtimeService imports.
  root.find(j.ImportDeclaration, {
    source: {
      value: "@/services/runtimeService",
    },
  }).forEach(path => {
    path.value.specifiers = path.value.specifiers.filter(spec => {
      return !(
        spec.type === "ImportSpecifier" &&
        symbols.has(spec.imported.name)
      );
    });

    if (path.value.specifiers.length === 0) {
      j(path).remove();
    }
  });

  // Add import from runtime/manualStop if needed.
  const used = [];

  root.find(j.Identifier).forEach(path => {
    if (symbols.has(path.value.name)) {
      if (!used.includes(path.value.name)) {
        used.push(path.value.name);
      }
    }
  });

  if (used.length) {
    const already =
      root.find(j.ImportDeclaration, {
        source: {
          value: "@/services/runtime/manualStop",
        },
      });

    if (already.size()) {
      const decl = already.get().node;
      const existing = new Set(
        decl.specifiers
          .filter(s => s.type === "ImportSpecifier")
          .map(s => s.imported.name),
      );

      used.forEach(name => {
        if (!existing.has(name)) {
          decl.specifiers.push(
            j.importSpecifier(
              j.identifier(name),
            ),
          );
        }
      });
    } else {
      root.get().node.program.body.unshift(
        j.importDeclaration(
          used.map(name =>
            j.importSpecifier(
              j.identifier(name),
            ),
          ),
          j.literal(
            "@/services/runtime/manualStop",
          ),
        ),
      );
    }
  }

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
