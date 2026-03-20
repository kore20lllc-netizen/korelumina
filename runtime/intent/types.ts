export type BuildIntent =
  | "website"
  | "webapp"
  | "mobile"
  | "backend"

export type UserMode =
  | "nontech"
  | "designer"
  | "dev"

export type IntentState = {
  buildIntent: BuildIntent
  userMode: UserMode
}
