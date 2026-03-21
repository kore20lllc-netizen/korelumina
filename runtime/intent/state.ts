export type IntentTarget =
  | "website"
  | "app"
  | "mobile"

export type IntentMode =
  | "dev"
  | "designer"
  | "nontech"

export type IntentState = {
  projectId: string
  target: IntentTarget
  mode: IntentMode
}

const store = new Map<string, IntentState>()

export async function getIntentState(projectId: string): Promise<IntentState | null> {
  return store.get(projectId) || null
}

export async function setIntentState(intent: IntentState): Promise<void> {
  store.set(intent.projectId, intent)
}
