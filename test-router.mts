import { resolveWorkspace } from "./runtime/intent/router.ts"

try {
  const route = await resolveWorkspace("demo-project")
  console.log("RESULT:", route)
} catch (e) {
  console.log("ERROR RAW:", e)
  console.log("ERROR STRING:", String(e))
  try {
    console.log("ERROR JSON:", JSON.stringify(e))
  } catch {
    console.log("ERROR JSON:", "unserializable")
  }
}
