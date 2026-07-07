module.exports = function(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  api.report("Sidebar NavigationFooter wrapper v2 transform loaded.");

  const source = file.source;

  const formatted = source
    .replace(
      '<div className="flex-1" /><NavigationFooter>',
      '<div className="flex-1" />\n\n        <NavigationFooter>',
    )
    .replace(
      "</NavigationFooter></aside>",
      "</NavigationFooter>\n      </aside>",
    );

  return formatted;
};

module.exports.parser = "tsx";
