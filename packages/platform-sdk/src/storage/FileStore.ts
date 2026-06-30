import fs from "node:fs";
import path from "node:path";

export class FileStore {
  constructor(
    private readonly root: string,
  ) {}

  private ensureRoot() {
    fs.mkdirSync(this.root, {
      recursive: true,
    });
  }

  private resolve(file: string) {
    this.ensureRoot();
    return path.join(this.root, file);
  }

  read(file: string): string | null {
    const full = this.resolve(file);

    if (!fs.existsSync(full)) {
      return null;
    }

    return fs.readFileSync(full, "utf8");
  }

  write(file: string, contents: string) {
    const full = this.resolve(file);
    const tmp = `${full}.tmp`;

    fs.writeFileSync(tmp, contents, "utf8");
    fs.renameSync(tmp, full);
  }

  remove(file: string) {
    const full = this.resolve(file);

    if (fs.existsSync(full)) {
      fs.unlinkSync(full);
    }
  }

  list(): string[] {
    this.ensureRoot();

    return fs.readdirSync(this.root);
  }
}
