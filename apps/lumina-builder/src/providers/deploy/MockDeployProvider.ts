import type {
  DeployInput,
  DeployProvider,
  DeployResult,
  DomainValidationResult,
} from "@/providers/types";

export class MockDeployProvider implements DeployProvider {
  async deploy(input: DeployInput): Promise<DeployResult> {
    console.warn(
      "[KoreLumina] MockDeployProvider used.",
    );

    input.onLog?.("Deployment engine is not installed.");
    input.onLog?.("Returning preview placeholder URL.");

    return {
      success: true,
      url:
        input.customDomain
          ? `https://${input.customDomain}`
          : "https://preview.korelumina.local",
    };
  }

  async validateDomain(
    domain: string,
  ): Promise<DomainValidationResult> {
    const normalized =
      domain.trim().toLowerCase();

    if (!normalized) {
      return {
        ok: false,
        reason: "Domain is required.",
      };
    }

    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
      return {
        ok: false,
        reason: "Invalid domain format.",
      };
    }

    return {
      ok: true,
      records: [
        {
          type: "CNAME",
          name: normalized,
          value: "cname.korelumina.local",
        },
      ],
    };
  }
}
