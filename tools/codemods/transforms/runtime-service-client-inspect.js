module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.VariableDeclaration).forEach(path => {
    path.value.declarations.forEach(decl => {
      if (decl.id.type === "Identifier") {
        api.report(`VAR: ${decl.id.name}`);
      }
    });
  });

  root.find(j.FunctionDeclaration).forEach(path => {
    if (path.value.id) {
      api.report(`FUNC: ${path.value.id.name}`);
    }
  });

  return file.source;
};

module.exports.parser = "tsx";
