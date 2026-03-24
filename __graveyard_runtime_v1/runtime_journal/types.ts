export type JournalEntry = {
  t:number
  type:
    | "ai-plan"
    | "ai-exec"
    | "ai-generate"
    | "fs-write"
    | "preview-reload"

  file?:string
  prompt?:string
}
