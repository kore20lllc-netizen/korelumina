module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  //
  // Remove:
  //   export const RUNTIME_API
  //   function runtimeCallerHeaders
  //   export function getRuntimeCallerHeaders
  //

  root.find(j.VariableDeclaration)
    .filter(path =>
      path.value.declarations.some(
        d =>
          d.id.type === "Identifier" &&
          d.id.name === "RUNTIME_API"
      )
    )
    .remove();

  root.find(j.FunctionDeclaration, {
    id: {
      type: "Identifier",
      name: "runtimeCallerHeaders",
    },
  }).remove();

  root.find(j.FunctionDeclaration, {
    id: {
      type: "Identifier",
      name: "getRuntimeCallerHeaders",
    },
  }).remove();

  //
  // Remove imports now provided by runtime/client.ts
  //

  root.find(j.ImportDeclaration)
    .filter(path =>
      path.value.source.value === "@/providers/auth-registry" ||
      path.value.source.value === "@/context/ActiveTeamContext" ||
      path.value.source.value === "@/services/workspaceAccessService"
    )
    .remove();

  //
  // Add replacement import
  //

  const alreadyImported =
    root.find(j.ImportDeclaration, {
      source: {
        value: "@/services/runtime/client",
      },
    }).size() > 0;

  if (!alreadyImported) {
    root
      .get()
      .node
      .program
      .body
      .unshift(
        j.importDeclaration(
          [
            j.importSpecifier(
              j.identifier("RUNTIME_API"),
            ),
            j.importSpecifier(
              j.identifier("getRuntimeCallerHeaders"),
            ),
          ],
          j.literal(
            "@/services/runtime/client",
          ),
        ),
      );
  }

  //
  // Rewrite calls
  //

  root.find(j.CallExpression, {
    callee: {
      type: "Identifier",
      name: "runtimeCallerHeaders",
    },
  }).replaceWith(path =>
    j.callExpression(
      j.identifier(
        "getRuntimeCallerHeaders",
      ),
      path.value.arguments,
    ),
  );

  return root.toSource({
    quote: "double",
    trailingComma: true,
  });
};

module.exports.parser = "tsx";
