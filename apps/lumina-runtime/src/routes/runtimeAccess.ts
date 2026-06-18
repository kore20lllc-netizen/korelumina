import type {
  NextFunction,
  Request,
  Response,
} from "express";

function isLoopbackAddress(address?: string | null) {
  if (!address) {
    return false;
  }

  return (
    address === "127.0.0.1" ||
    address === "::1" ||
    address === "::ffff:127.0.0.1" ||
    address === "localhost"
  );
}

export function requireRuntimeAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const expectedToken =
    process.env.KORELUMINA_RUNTIME_INTERNAL_TOKEN;

  const providedToken =
    req.header("x-korelumina-runtime-token");

  if (
    expectedToken &&
    providedToken === expectedToken
  ) {
    return next();
  }

  if (
    isLoopbackAddress(
      req.socket.remoteAddress,
    )
  ) {
    return next();
  }

  return res.status(403).json({
    ok: false,
    error: "runtime_access_denied",
  });
}
