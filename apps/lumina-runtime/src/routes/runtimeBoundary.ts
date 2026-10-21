import type {
  NextFunction,
  Request,
  Response,
} from "express";

/*
 * ADR-0041 Decision 5 (KO-5a): Runtime network boundary.
 *
 * The Runtime serves the Builder on the same machine. It must not be
 * reachable from other devices by default, must not accept browser
 * requests from arbitrary web pages, and must not let an agent act on
 * human-only executive routes.
 */

export const DEFAULT_RUNTIME_HOST =
  "127.0.0.1";

export const DEFAULT_RUNTIME_ALLOWED_ORIGINS:
  readonly string[] =
  [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ];

export function resolveRuntimeHost(
  value:
    string | undefined,
): string {
  const trimmed =
    value?.trim();

  return trimmed
    ? trimmed
    : DEFAULT_RUNTIME_HOST;
}

export function resolveAllowedRuntimeOrigins(
  value:
    string | undefined,
): string[] {
  const configured =
    (value ?? "")
      .split(",")
      .map(
        (origin) =>
          origin
            .trim()
            .replace(/\/+$/, ""),
      )
      .filter(
        (origin) =>
          origin.length > 0,
      );

  return configured.length > 0
    ? configured
    : [
        ...DEFAULT_RUNTIME_ALLOWED_ORIGINS,
      ];
}

/*
 * CORS headers alone do not stop a browser from sending a request.
 * Any request that carries a browser Origin outside the allow-list is
 * refused before it reaches a route. Requests without an Origin
 * (curl, CLI, server-side callers) are unaffected; they remain subject
 * to route-level access checks.
 */
export function rejectDisallowedBrowserOrigins(
  allowedOrigins:
    readonly string[],
) {
  const allowed =
    new Set(
      allowedOrigins,
    );

  return (
    req:
      Request,
    res:
      Response,
    next:
      NextFunction,
  ) => {
    const origin =
      req.header(
        "origin",
      );

    if (
      !origin ||
      allowed.has(
        origin.replace(/\/+$/, ""),
      )
    ) {
      return next();
    }

    return res
      .status(403)
      .json({
        ok:
          false,
        error:
          "runtime_origin_not_allowed",
      });
  };
}

const HUMAN_ONLY_EXECUTIVE_ROUTES:
  readonly RegExp[] =
  [
    /^\/approvals\/[^/]+\/approve\/?$/,
    /^\/approvals\/[^/]+\/reject\/?$/,
    /^\/actions\/[^/]+\/authorize-execution\/?$/,
    /^\/actions\/[^/]+\/execute-operation\/?$/,
    /^\/actions\/[^/]+\/execute-mutation\/?$/,
    /^\/decisions\/[^/]+\/delegate\/?$/,
    /* MS-1 (ADR-0044 Decision 2): mission steps only the owner takes. */
    /^\/missions\/[^/]+\/(approve|reject|block|unblock|cancel|archive)\/?$/,
    /* MS-4 (ADR-0044 Decision 5): task status and build verification are the owner's evidence. */
    /^\/missions\/[^/]+\/(tasks\/[^/]+|verifications)\/?$/,
    /* MS-2026-0004: only the owner acknowledges Critical notifications. */
    /^\/acknowledgements\/?$/,
  ];

export function isHumanOnlyExecutivePath(
  pathWithinExecutive:
    string,
): boolean {
  return HUMAN_ONLY_EXECUTIVE_ROUTES.some(
    (pattern) =>
      pattern.test(
        pathWithinExecutive,
      ),
  );
}

export function isAgentActorId(
  actorId:
    string,
): boolean {
  const normalized =
    actorId
      .trim()
      .toLowerCase();

  return (
    normalized === "chief-agent" ||
    normalized.startsWith("agent:") ||
    normalized.endsWith("-agent")
  );
}

/*
 * Mounted on /api/executive. Human-only executive decisions refuse any
 * request whose declared actor is an agent, before route logic runs.
 */
export function rejectAgentActorsOnHumanOnlyExecutiveRoutes(
  req:
    Request,
  res:
    Response,
  next:
    NextFunction,
) {
  if (
    req.method !== "POST" ||
    !isHumanOnlyExecutivePath(
      req.path,
    )
  ) {
    return next();
  }

  const body =
    req.body ?? {};

  const declaredActors =
    [
      body.actorId,
      body.approverId,
      body.authorizedBy,
      body.requestedBy,
    ].filter(
      (value): value is string =>
        typeof value === "string",
    );

  if (
    declaredActors.some(
      isAgentActorId,
    )
  ) {
    return res
      .status(403)
      .json({
        ok:
          false,
        error:
          "executive_route_requires_human_actor",
      });
  }

  return next();
}
