module.exports = function (file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Sidebar NavigationSection transform loaded.");

  //
  // Ensure NavigationSection import exists.
  //
  const navImport = root.find(j.ImportDeclaration, {
    source: {
      value: "@/components/lumina/navigation",
    },
  });

  if (navImport.size()) {
    navImport.forEach((p) => {
      const hasSection = p.node.specifiers.some(
        (s) =>
          s.type === "ImportSpecifier" &&
          s.imported.name === "NavigationSection",
      );

      if (!hasSection) {
        p.node.specifiers.push(
          j.importSpecifier(
            j.identifier("NavigationSection"),
          ),
        );
      }
    });
  }

  //
  // Replace the Admin header button with NavigationSection.
  //
  root
    .find(j.JSXElement)
    .filter((path) => {
      const opening = path.node.openingElement;

      if (
        opening.name.type !== "JSXIdentifier" ||
        opening.name.name !== "button"
      ) {
        return false;
      }

      const text = j(path)
        .find(j.JSXText)
        .nodes()
        .map((n) => n.value.trim())
        .filter(Boolean)
        .join(" ");

      return text === "Admin";
    })
    .forEach((path) => {
      path.replace(
        j.jsxElement(
          j.jsxOpeningElement(
            j.jsxIdentifier("NavigationSection"),
            [
              j.jsxAttribute(
                j.jsxIdentifier("title"),
                j.stringLiteral("Admin"),
              ),
              j.jsxAttribute(
                j.jsxIdentifier("collapsed"),
                j.jsxExpressionContainer(
                  j.unaryExpression(
                    "!",
                    j.identifier("adminOpen"),
                  ),
                ),
              ),
              j.jsxAttribute(
                j.jsxIdentifier("onToggle"),
                j.jsxExpressionContainer(
                  j.identifier("toggleAdmin"),
                ),
              ),
            ],
            true,
          ),
          null,
          [],
        ),
      );
    });

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
