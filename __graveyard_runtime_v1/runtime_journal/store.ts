import { JournalEntry } from "./types"

const store: Record<string, JournalEntry[]> = {}

export function pushEntry(projectId: string, entry: JournalEntry){
  if(!store[projectId]) store[projectId] = []
  store[projectId].push(entry)
}

export function getJournal(projectId: string){
  return store[projectId] || []
}

export function clearJournal(projectId: string){
  store[projectId] = []
}
