import fs from "node:fs";

export function atomicWrite(
  filePath: string,
  contents: string,
) {
  const tmp = `${filePath}.tmp`;

  fs.writeFileSync(
    tmp,
    contents,
    "utf8",
  );

  fs.renameSync(
    tmp,
    filePath,
  );
}
