import path from "path";

export function runtimeRoot() {
  return path.join(process.cwd(), "runtime");
}
