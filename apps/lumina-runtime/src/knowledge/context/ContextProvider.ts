import type {
  ContextDocument,
} from "./ContextDocument.js";

import type {
  ContextRequest,
} from "./ContextRequest.js";

export interface ContextProvider {
  readonly providerId: string;

  buildContext(
    request: ContextRequest,
  ): ContextDocument;
}
