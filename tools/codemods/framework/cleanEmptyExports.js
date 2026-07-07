module.exports = function cleanEmptyExports(source) {
  return source
    .replace(/^\s*export\s*\{\};\s*\n/gm, "")
    .replace(/^\s*export\s+type\s*\{\};\s*\n/gm, "")
    .replace(/\n{3,}/g, "\n\n");
};
