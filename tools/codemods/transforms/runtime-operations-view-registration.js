module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  const files = {
    workspace:
      "apps/lumina-builder/src/context/WorkspaceContext.tsx",
    navigation:
      "apps/lumina-builder/src/services/navigationService.ts",
  };

  const target =
    file.path.replace(/\\/g, "/");

  const addLiteral = (aliasName) => {
    root.find(j.TSTypeAliasDeclaration).forEach(path => {
      if (path.value.id.name !== aliasName) {
        return;
      }

      const union = path.value.typeAnnotation;

      if (union.type !== "TSUnionType") {
        return;
      }

      const values = union.types
        .filter(t => t.type === "TSLiteralType")
        .map(t => t.literal.value);

      [
        "deployment-diagnostics",
        "runtime-operations",
        "knowledge-operations",
        "admin",
      ].forEach(name => {
        if (!values.includes(name)) {
          union.types.push(
            j.tsLiteralType(
              j.stringLiteral(name),
            ),
          );
        }
      });
    });
  };

  if (target.endsWith(files.workspace)) {
    addLiteral("View");
  }

  if (target.endsWith(files.navigation)) {
    addLiteral("AppView");
  }

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
