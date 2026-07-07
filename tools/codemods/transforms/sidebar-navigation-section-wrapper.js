module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Sidebar NavigationSection wrapper transform loaded.");

  // R-003b
  //
  // This transform will replace the temporary
  // NavigationSection placeholder with the final
  // wrapper component that owns the Admin section.
  //
  // It intentionally performs no mutations yet.
  // The wrapper migration will be implemented
  // in this ticket.

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
