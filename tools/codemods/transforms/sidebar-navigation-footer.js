module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Sidebar NavigationFooter transform loaded.");

  const navImport = root.find(j.ImportDeclaration, {
    source: {
      value: "@/components/lumina/navigation",
    },
  });

  if (navImport.size()) {
    navImport.forEach((p) => {
      const hasFooter = p.node.specifiers.some(
        (s) =>
          s.type === "ImportSpecifier" &&
          s.imported.name === "NavigationFooter",
      );

      if (!hasFooter) {
        p.node.specifiers.push(
          j.importSpecifier(j.identifier("NavigationFooter")),
        );
      }
    });
  }

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
