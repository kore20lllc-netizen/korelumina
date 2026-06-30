import path from "node:path";

import {
  fileSystem,
} from "../filesystem/FileSystem.js";

export class FileStore {
  constructor(
    private readonly root: string,
  ) {}

  private ensureRoot() {
    fileSystem.mkdir(
      this.root,
    );
  }

  private resolve(file: string) {
    this.ensureRoot();

    return path.join(
      this.root,
      file,
    );
  }

  read(file: string): string | null {
    const full =
      this.resolve(file);

    if (!fileSystem.exists(full)) {
      return null;
    }

    return fileSystem.readText(full);
  }

  write(file: string, contents: string) {
    const full =
      this.resolve(file);

    fileSystem.writeTextAtomic(
      full,
      contents,
    );
  }

  remove(file: string) {
    const full =
      this.resolve(file);

    fileSystem.remove(full);
  }

  list(): string[] {
    this.ensureRoot();

    return fileSystem.list(
      this.root,
    );
  }
}
