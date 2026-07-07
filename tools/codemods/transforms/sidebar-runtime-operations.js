module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.VariableDeclarator, {
    id: { name: "adminItems" },
  }).forEach(path => {
    const cond = path.value.init;

    if (!cond || cond.type !== "ConditionalExpression") {
      return;
    }

    const arr = cond.consequent;

    if (!arr || arr.type !== "ArrayExpression") {
      return;
    }

    const exists = arr.elements.some(el => {
      if (!el || el.type !== "ObjectExpression") {
        return false;
      }

      const label = el.properties.find(
        p =>
          p.type === "ObjectProperty" &&
          p.key.type === "Identifier" &&
          p.key.name === "label",
      );

      return (
        label &&
        label.value.type === "StringLiteral" &&
        label.value.value === "Runtime Operations"
      );
    });

    if (exists) {
      return;
    }

    arr.elements.splice(
      3,
      0,
      j.objectExpression([
        j.objectProperty(
          j.identifier("icon"),
          j.identifier("Gauge"),
        ),
        j.objectProperty(
          j.identifier("label"),
          j.stringLiteral("Runtime Operations"),
        ),
        j.objectProperty(
          j.identifier("active"),
          j.binaryExpression(
            "===",
            j.identifier("view"),
            j.stringLiteral("runtime-operations"),
          ),
        ),
      ]),
    );
  });

  root.find(j.IfStatement).forEach(path => {
    const test = path.value.test;

    if (
      !test ||
      test.type !== "BinaryExpression" ||
      test.operator !== "===" ||
      test.right.type !== "StringLiteral" ||
      test.right.value !== "Deployment Diagnostics"
    ) {
      return;
    }

    const parent = path.parent.value.body;

    const already = parent.some(
      s =>
        s.type === "IfStatement" &&
        s.test.type === "BinaryExpression" &&
        s.test.right.type === "StringLiteral" &&
        s.test.right.value === "Runtime Operations",
    );

    if (already) {
      return;
    }

    parent.splice(
      parent.indexOf(path.value),
      0,
      j.ifStatement(
        j.binaryExpression(
          "===",
          j.memberExpression(
            j.identifier("item"),
            j.identifier("label"),
          ),
          j.stringLiteral("Runtime Operations"),
        ),
        j.blockStatement([
          j.expressionStatement(
            j.callExpression(
              j.identifier("setView"),
              [j.stringLiteral("runtime-operations")],
            ),
          ),
        ]),
      ),
    );
  });

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
