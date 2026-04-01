export type Draft = {
  id: string
  path: string
  content: string
  t: number
}

type Store = Record<string, Draft[]>

function getStore(): Store {
  const g = globalThis as any
  if (!g.__KORE_DRAFT_STORE__) {
    g.__KORE_DRAFT_STORE__ = {}
  }
  return g.__KORE_DRAFT_STORE__
}

export function pushDraft(projectId: string, draft: Draft){
  const s = getStore()
  if(!s[projectId]) s[projectId] = []
  s[projectId].push(draft)
}

export function listDrafts(projectId: string){
  const s = getStore()
  return s[projectId] || []
}

export function removeDraft(projectId: string, id: string){
  const s = getStore()
  s[projectId] = (s[projectId] || []).filter(d=>d.id !== id)
}

export function getDraft(projectId: string, id: string){
  return (getStore()[projectId] || []).find(d=>d.id === id)
}
