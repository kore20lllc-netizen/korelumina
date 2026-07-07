module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("NavigationSection controlled-state transform loaded.");

  //
  // 1. Add expanded?
  //
  root.find(j.TSInterfaceDeclaration, {
    id: { name: "NavigationSectionProps" },
  }).forEach(path => {
    const body = path.node.body.body;

    const hasExpanded =
      body.some(
        m =>
          m.key &&
          m.key.name === "expanded",
      );

    if (!hasExpanded) {
      body.splice(
        2,
        0,
        j.tsPropertySignature(
          j.identifier("expanded"),
          j.tsTypeAnnotation(
            j.tsBooleanKeyword(),
          ),
        ),
      );

      body[2].optional = true;
    }

    const hasToggle =
      body.some(
        m =>
          m.key &&
          m.key.name === "onToggle",
      );

    if (!hasToggle) {
      body.splice(
        4,
        0,
        j.tsPropertySignature(
          j.identifier("onToggle"),
          j.tsTypeAnnotation(
            j.tsFunctionType(
              [],
              j.tsTypeAnnotation(
                j.tsVoidKeyword(),
              ),
            ),
          ),
        ),
      );

      body[4].optional = true;
    }
  });

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
