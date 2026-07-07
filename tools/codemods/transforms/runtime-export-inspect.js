module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.ExportNamedDeclaration).forEach(path => {
    const decl = path.value.declaration;

    if (!decl) return;

    if (decl.type === "TSInterfaceDeclaration") {
      api.report(
        `EXPORT_INTERFACE ${decl.id.name}`,
      );
    }

    if (decl.type === "FunctionDeclaration") {
      api.report(
        `EXPORT_FUNCTION ${decl.id.name}`,
      );
    }
  });

  return file.source;
};

module.exports.parser = "tsx";
