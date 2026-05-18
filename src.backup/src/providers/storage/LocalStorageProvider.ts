import { readJSON, writeJSON, removeKey } from "@/lib/persistence";
import type { StorageProvider } from "@/providers/types";

export class LocalStorageProvider implements StorageProvider {
  async putText(key: string, content: string) { writeJSON("storage", key, content); }
  async getText(key: string) { return readJSON<string | null>("storage", key, null); }
  async remove(key: string) { removeKey("storage", key); }
}