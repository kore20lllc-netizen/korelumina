export function enforceDevOnly() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This endpoint is disabled in production");
  }
}
