export function buildRuntimeCommand(
  framework: string,
  port: number,
): string[] {
  if (
    framework === "next"
  ) {
    return [
      "run",
      "dev",
      "--",
      "--hostname",
      "0.0.0.0",
      "--port",
      String(port),
    ];
  }

  return [
    "run",
    "dev",
    "--",
    "--host",
    "0.0.0.0",
    "--port",
    String(port),
    "--strictPort",
  ];
}
