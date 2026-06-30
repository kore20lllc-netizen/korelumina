import fs from "node:fs";
import path from "node:path";

export function assertProjectReady(
  projectPath: string,
) {
  const packageJsonPath =
    path.join(
      projectPath,
      "package.json",
    );

  if (
    !fs.existsSync(projectPath)
  ) {
    throw new Error(
      `project_not_found:${projectPath}`,
    );
  }

  if (
    !fs.existsSync(
      packageJsonPath,
    )
  ) {
    throw new Error(
      "missing_package_json",
    );
  }

  const packageJson =
    JSON.parse(
      fs.readFileSync(
        packageJsonPath,
        "utf8",
      ),
    );

  if (
    !packageJson.scripts?.dev
  ) {
    throw new Error(
      "missing_dev_script",
    );
  }
}
