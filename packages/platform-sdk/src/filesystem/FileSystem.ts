import fs from "node:fs";
import path from "node:path";

export class FileSystem {
  exists(filePath: string) {
    return fs.existsSync(filePath);
  }

  stat(filePath: string) {
    return fs.statSync(filePath);
  }

  list(dirPath: string) {
    return fs.readdirSync(dirPath);
  }

  listEntries(
    dirPath: string,
  ) {
    return fs.readdirSync(
      dirPath,
      {
        withFileTypes: true,
      },
    );
  }

  readText(
    filePath: string,
    encoding: BufferEncoding = "utf8",
  ) {
    return fs.readFileSync(
      filePath,
      encoding,
    );
  }

  writeText(
    filePath: string,
    contents: string,
    encoding: BufferEncoding = "utf8",
  ) {
    fs.writeFileSync(
      filePath,
      contents,
      encoding,
    );
  }

  writeTextAtomic(
    filePath: string,
    contents: string,
  ) {
    this.ensureParent(filePath);

    const tmpPath =
      `${filePath}.${process.pid}.${Date.now()}.tmp`;

    fs.writeFileSync(
      tmpPath,
      contents,
      "utf8",
    );

    fs.renameSync(
      tmpPath,
      filePath,
    );
  }

  remove(filePath: string) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  mkdir(dirPath: string) {
    fs.mkdirSync(
      dirPath,
      {
        recursive: true,
      },
    );
  }

  ensureParent(filePath: string) {
    this.mkdir(
      path.dirname(filePath),
    );
  }
}

export const fileSystem =
  new FileSystem();
