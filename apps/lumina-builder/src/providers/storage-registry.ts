import { LocalStorageProvider } from "@/providers/storage/LocalStorageProvider";
import type { StorageProvider } from "@/providers/types";

export const storage: StorageProvider =
  new LocalStorageProvider();
