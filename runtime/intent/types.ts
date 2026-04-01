export type IntentTarget =
  | "website"
  | "webapp"
  | "mobile"
  | "backend"
  | "import"

export type IntentMode =
  | "nontech"
  | "designer"
  | "developer"

export type IntentState = {
  projectId: string
  target: IntentTarget
  mode: IntentMode
}
