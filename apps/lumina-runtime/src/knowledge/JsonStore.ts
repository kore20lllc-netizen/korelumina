import { FileStore } from "./FileStore.js";

export class JsonStore {
  constructor(
    private readonly files: FileStore,
  ) {}

  read<T>(file: string): T | null {
    const text = this.files.read(file);

    if (!text) {
      return null;
    }

    return JSON.parse(text) as T;
  }

  write<T>(file: string, value: T) {
    this.files.write(
      file,
      JSON.stringify(value, null, 2),
    );
  }

  remove(file: string) {
    this.files.remove(file);
  }

  list() {
    return this.files.list();
  }
}
