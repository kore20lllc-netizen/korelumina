module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Sidebar NavigationItem transform loaded.");

  //
  // Add NavigationItem import
  //
  const hasImport = root.find(j.ImportDeclaration, {
    source: {
      value: "@/components/lumina/navigation",
    },
  });

  if (hasImport.size() === 0) {
    const imports = root.find(j.ImportDeclaration);

    imports.at(imports.size() - 1).insertAfter(
      j.importDeclaration(
        [
          j.importSpecifier(
            j.identifier("NavigationItem"),
          ),
        ],
        j.literal(
          "@/components/lumina/navigation",
        ),
      ),
    );
  }

  //
  // Replace navigation buttons only.
  //
  root
    .find(j.JSXElement, {
      openingElement: {
        name: {
          type: "JSXIdentifier",
          name: "button",
        },
      },
    })
    .filter(path => {
      const text = j(path).toSource();

      return (
        text.includes("title={item.label}") &&
        text.includes("onClick={() =>") &&
        text.includes("<Icon")
      );
    })
    .replaceWith(path => {
      return j.jsxElement(
        j.jsxOpeningElement(
          j.jsxIdentifier("NavigationItem"),
          [
            j.jsxAttribute(
              j.jsxIdentifier("label"),
              j.jsxExpressionContainer(
                j.identifier("item.label"),
              ),
            ),
            j.jsxAttribute(
              j.jsxIdentifier("icon"),
              j.jsxExpressionContainer(
                j.jsxElement(
                  j.jsxOpeningElement(
                    j.jsxIdentifier("Icon"),
                    [],
                    true,
                  ),
                  null,
                  [],
                ),
              ),
            ),
            j.jsxAttribute(
              j.jsxIdentifier("badge"),
              j.jsxExpressionContainer(
                j.identifier("item.badge"),
              ),
            ),
            j.jsxAttribute(
              j.jsxIdentifier("active"),
              j.jsxExpressionContainer(
                j.conditionalExpression(
                  j.identifier("activeLabel"),
                  j.binaryExpression(
                    "===",
                    j.identifier("activeLabel"),
                    j.memberExpression(
                      j.identifier("item"),
                      j.identifier("label"),
                    ),
                  ),
                  j.memberExpression(
                    j.identifier("item"),
                    j.identifier("active"),
                  ),
                ),
              ),
            ),
            j.jsxAttribute(
              j.jsxIdentifier("compact"),
              j.jsxExpressionContainer(
                j.literal(true),
              ),
            ),
            j.jsxAttribute(
              j.jsxIdentifier("onClick"),
              path.node.openingElement.attributes.find(
                a =>
                  a.type === "JSXAttribute" &&
                  a.name.name === "onClick",
              ).value,
            ),
          ],
          true,
        ),
        null,
        [],
      );
    });

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
