import fs from "node:fs";
import path from "node:path";

export type CanonicalReviewPolicyStatus =
  | "draft"
  | "active"
  | "revoked"
  | "superseded";

export interface CanonicalReviewPolicyAuthority {
  id:
    string;

  version:
    string;

  status:
    CanonicalReviewPolicyStatus;

  title:
    string;

  authority:
    string;

  scope:
    string;

  owner:
    string;

  authorizedBy:
    string;

  authorizedAt:
    number;

  createdAt:
    number;

  updatedAt:
    number;

  supersedes:
    string[];

  supersededBy:
    string | null;

  rules: {
    requireCompleteGovernanceIdentity:
      boolean;

    requireProvenance:
      boolean;

    requireValidationPassed:
      boolean;

    excludedAuthorities:
      string[];
  };
}

function resolveRepositoryRoot():
string {
  let current =
    process.cwd();

  for (
    let depth = 0;
    depth < 8;
    depth += 1
  ) {
    if (
      fs.existsSync(
        path.join(
          current,
          "package.json",
        ),
      ) &&
      fs.existsSync(
        path.join(
          current,
          "apps",
          "lumina-runtime",
          "package.json",
        ),
      )
    ) {
      return current;
    }

    const parent =
      path.dirname(
        current,
      );

    if (
      parent === current
    ) {
      break;
    }

    current =
      parent;
  }

  throw new Error(
    "korelumina_repository_root_not_found",
  );
}

const policyRoot =
  path.join(
    resolveRepositoryRoot(),
    "runtime",
    "knowledge",
    "review-policies",
  );

function policyKey(
  id:
    string,

  version:
    string,
): string {
  return `${id}@${version}`;
}

function policyPath(
  id:
    string,

  version:
    string,
): string {
  const safe =
    policyKey(
      id,
      version,
    )
      .replaceAll(
        "/",
        "_",
      )
      .replaceAll(
        "\\",
        "_",
      );

  return path.join(
    policyRoot,
    `${safe}.json`,
  );
}

export function saveCanonicalReviewPolicy(
  policy:
    CanonicalReviewPolicyAuthority,
): void {
  if (
    !policy.id.trim() ||
    !policy.version.trim() ||
    !policy.authority.trim() ||
    !policy.scope.trim() ||
    !policy.owner.trim() ||
    (
      policy.status ===
        "active" &&
      (
        !policy.authorizedBy.trim() ||
        policy.authorizedAt <= 0
      )
    )
  ) {
    throw new Error(
      "canonical_review_policy_governance_incomplete",
    );
  }

  fs.mkdirSync(
    policyRoot,
    {
      recursive:
        true,
    },
  );

  fs.writeFileSync(
    policyPath(
      policy.id,
      policy.version,
    ),
    JSON.stringify(
      policy,
      null,
      2,
    ),
    "utf8",
  );
}

export function loadCanonicalReviewPolicy(
  id:
    string,

  version:
    string,
):
  CanonicalReviewPolicyAuthority |
  null {
  const file =
    policyPath(
      id,
      version,
    );

  if (
    !fs.existsSync(
      file,
    )
  ) {
    return null;
  }

  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8",
    ),
  ) as CanonicalReviewPolicyAuthority;
}

export function listCanonicalReviewPolicies():
CanonicalReviewPolicyAuthority[] {
  if (
    !fs.existsSync(
      policyRoot,
    )
  ) {
    return [];
  }

  return fs
    .readdirSync(
      policyRoot,
    )
    .filter(
      (name) =>
        name.endsWith(
          ".json",
        ),
    )
    .map(
      (name) =>
        JSON.parse(
          fs.readFileSync(
            path.join(
              policyRoot,
              name,
            ),
            "utf8",
          ),
        ) as
          CanonicalReviewPolicyAuthority,
    )
    .sort(
      (
        left,
        right,
      ) =>
        right.updatedAt -
        left.updatedAt,
    );
}

export function deleteCanonicalReviewPolicy(
  id:
    string,

  version:
    string,
): void {
  const file =
    policyPath(
      id,
      version,
    );

  if (
    !fs.existsSync(
      file,
    )
  ) {
    throw new Error(
      `canonical_review_policy_not_found:${id}@${version}`,
    );
  }

  fs.unlinkSync(
    file,
  );
}

export function removeCanonicalReviewPolicyForTest(
  id:
    string,

  version:
    string,
): void {
  const file =
    policyPath(
      id,
      version,
    );

  if (
    fs.existsSync(
      file,
    )
  ) {
    fs.unlinkSync(
      file,
    );
  }
}
