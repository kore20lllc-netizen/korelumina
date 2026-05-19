import { NotImplementedError } from "@/lib/errors";
import type { RepositoryProvider } from "@/providers/types";

/** Real GitHub adapter — uses the GitHub REST API via an edge function. */
export class GitHubRepositoryProvider implements RepositoryProvider {
  importFromGithub(): never { throw new NotImplementedError("GitHubRepositoryProvider.importFromGithub"); }
  importFromZip(): never { throw new NotImplementedError("GitHubRepositoryProvider.importFromZip"); }
}