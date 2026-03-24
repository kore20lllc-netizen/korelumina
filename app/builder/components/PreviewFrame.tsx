"use client"

export default function PreviewFrame({
  projectId,
  version
}:{
  projectId:string
  version:number
}){

  const src =
    "/api/dev/preview?projectId=" +
    projectId +
    "&v=" +
    version

  return (
    <iframe
      key={version}
      src={src}
      style={{
        width:"100%",
        height:"100%",
        border:"none",
        background:"white"
      }}
    />
  )
}
