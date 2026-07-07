module.exports = function removeExportedDeclarations(
  root,
  j,
  names,
) {
  const wanted = new Set(names);

  root
    .find(j.ExportNamedDeclaration)
    .filter(path => {
      const decl = path.value.declaration;

      if (!decl) {
        return false;
      }

      return (
        (
          decl.type === "FunctionDeclaration" ||
          decl.type === "TSInterfaceDeclaration" ||
          decl.type === "TSTypeAliasDeclaration"
        ) &&
        decl.id &&
        wanted.has(decl.id.name)
      );
    })
    .remove();

  root
    .find(j.FunctionDeclaration)
    .filter(path =>
      path.value.id &&
      wanted.has(path.value.id.name)
    )
    .remove();

  root
    .find(j.TSInterfaceDeclaration)
    .filter(path =>
      wanted.has(path.value.id.name)
    )
    .remove();

  root
    .find(j.TSTypeAliasDeclaration)
    .filter(path =>
      wanted.has(path.value.id.name)
    )
    .remove();
};
