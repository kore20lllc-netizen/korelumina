import { create } from "zustand"

type EditorState = {
  projectId: string | null
  activeFile: string | null
  content: string
  dirty: boolean
  saving: boolean

  setProject: (id:string)=>void
  openFile: (file:string, content:string)=>void
  updateContent: (c:string)=>void
  setSaving: (v:boolean)=>void
  markSaved: ()=>void
}

export const useEditorStore = create<EditorState>((set)=>({

  projectId:null,
  activeFile:null,
  content:"",
  dirty:false,
  saving:false,

  setProject:(id)=>set({ projectId:id }),

  openFile:(file,content)=>set({
    activeFile:file,
    content,
    dirty:false
  }),

  updateContent:(c)=>set({
    content:c,
    dirty:true
  }),

  setSaving:(v)=>set({ saving:v }),

  markSaved:()=>set({ dirty:false, saving:false })

}))
