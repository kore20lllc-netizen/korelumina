module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Sidebar NavigationFooter wrapper transform loaded.");

  root
    .find(j.JSXElement, {
      openingElement: {
        name: {
          type: "JSXIdentifier",
          name: "div",
        },
      },
    })
    .filter((path) => {
      const attrs = path.node.openingElement.attributes || [];

      return attrs.some(
        (attr) =>
          attr.type === "JSXAttribute" &&
          attr.name.name === "className" &&
          attr.value &&
          attr.value.type === "StringLiteral" &&
          attr.value.value === "flex-1",
      );
    })
    .forEach((path) => {
      const parent = path.parent.node.children;

      const index = parent.indexOf(path.node);

      if (index === -1) return;

      const footerChildren = [];

      let i = index + 1;

      while (i < parent.length) {
        const child = parent[i];

        if (
          child.type === "JSXText" &&
          child.value.trim() === ""
        ) {
          footerChildren.push(child);
          parent.splice(i, 1);
          continue;
        }

        footerChildren.push(child);
        parent.splice(i, 1);
      }

      parent.splice(
        index + 1,
        0,
        j.jsxElement(
          j.jsxOpeningElement(
            j.jsxIdentifier("NavigationFooter"),
            [],
            false,
          ),
          j.jsxClosingElement(
            j.jsxIdentifier("NavigationFooter"),
          ),
          footerChildren,
        ),
      );
    });

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
