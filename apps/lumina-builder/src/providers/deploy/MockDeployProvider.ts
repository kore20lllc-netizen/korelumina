import type { DeployProvider } from "@/providers/types";

export class MockDeployProvider implements DeployProvider {
  async deploy(): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    console.warn(
      "[KoreLumina] MockDeployProvider used.",
    );

    return {
      success: true,
      url: "https://preview.korelumina.local",
    };
  }
}
