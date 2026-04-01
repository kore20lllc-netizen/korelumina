"use client"

export default function SaveButton({onSave}:{onSave:()=>void}){
  return (
    <button
      onClick={onSave}
      style={{
        background:"#16a34a",
        color:"white",
        border:"none",
        padding:"8px 14px",
        borderRadius:8,
        fontWeight:600,
        cursor:"pointer"
      }}
    >
      Save
    </button>
  )
}
