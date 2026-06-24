import type {
  DeployInput,
  DeployProvider,
  DeployResult,
  DomainValidationResult,
} from "@/providers/types";

export class VercelDeployProvider implements DeployProvider {
  async deploy(input: DeployInput): Promise<DeployResult> {
    console.warn(
      "[KoreLumina] VercelDeployProvider placeholder active.",
    );

    input.onLog?.("Vercel deployment engine is not implemented.");
    input.onLog?.("Returning Vercel placeholder URL.");

    return {
      success: true,
      url:
        input.customDomain
          ? `https://${input.customDomain}`
          : "https://vercel.korelumina.app",
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
          value: "cname.vercel-dns.com",
        },
      ],
    };
  }
}
