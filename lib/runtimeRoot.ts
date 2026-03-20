import path from "path"

export function runtimeRoot(){
  return path.join(process.cwd(), ".kore_runtime")
}
