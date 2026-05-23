import type { DeployProvider } from "@/providers/types";

export class VercelDeployProvider implements DeployProvider {
  async deploy(): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    console.warn(
      "[KoreLumina] VercelDeployProvider placeholder active.",
    );

    return {
      success: true,
      url: "https://vercel.korelumina.app",
    };
  }
}
