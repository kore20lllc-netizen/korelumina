import { RealRuntimeOperationsService } from "./RealRuntimeOperationsService";
import type { RuntimeOperationsService } from "./types";

export const runtimeOperationsService: RuntimeOperationsService =
  new RealRuntimeOperationsService();

export type * from "./types";
