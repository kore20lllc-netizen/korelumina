import fs from "node:fs";

export class FileSystem {
  exists(path: string) {
    return fs.existsSync(path);
  }

  read(path: string, encoding: BufferEncoding = "utf8") {
    return fs.readFileSync(path, encoding);
  }

  write(
    path: string,
    contents: string,
    encoding: BufferEncoding = "utf8",
  ) {
    fs.writeFileSync(path, contents, encoding);
  }

  remove(path: string) {
    if (fs.existsSync(path)) {
      fs.unlinkSync(path);
    }
  }

  mkdir(path: string) {
    fs.mkdirSync(path, {
      recursive: true,
    });
  }

  list(path: string) {
    return fs.readdirSync(path);
  }

  stat(path: string) {
    return fs.statSync(path);
  }
}
