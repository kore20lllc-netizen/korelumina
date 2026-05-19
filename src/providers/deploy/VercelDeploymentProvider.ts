import { NotImplementedError } from "@/lib/errors";
import type { DeploymentProvider } from "@/providers/types";

/** Real Vercel adapter — calls the Vercel API via an edge function. */
export class VercelDeploymentProvider implements DeploymentProvider {
  deploy(): never { throw new NotImplementedError("VercelDeploymentProvider.deploy"); }
  list(): never { throw new NotImplementedError("VercelDeploymentProvider.list"); }
  validateDomain(): never { throw new NotImplementedError("VercelDeploymentProvider.validateDomain"); }
}