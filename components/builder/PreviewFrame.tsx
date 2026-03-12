"use client";

import { useEffect, useRef } from "react";

type Props = {
  projectId: string;
};

export default function PreviewFrame({ projectId }: Props) {

  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const instanceRef = useRef<string | null>(null)
  const loadingRef = useRef(false)
  const seqRef = useRef(0)

  async function loadPreview(reason = "unknown") {

    if (!instanceRef.current) return

    if ((window as any).__kore_preview_active !== instanceRef.current) {
      console.log("Preview skipped (inactive instance)")
      return
    }

    if (loadingRef.current) return
    loadingRef.current = true

    seqRef.current++

    try {

      const r = await fetch(
        "/api/dev/preview/bundle?projectId=" + projectId +
        "&instance=" + instanceRef.current +
        "&seq=" + seqRef.current +
        "&reason=" + reason,
        { cache: "no-store" }
      )

      const html = await r.text()

      const doc = iframeRef.current?.contentDocument
      if (!doc) return

      doc.open()
      doc.write(html)
      doc.close()

    } catch (e) {
      console.error("Preview load failed", e)
    } finally {
      loadingRef.current = false
    }
  }

  useEffect(() => {

    // SAFE WINDOW ACCESS HERE
    const id =
      (window as any).__kore_preview_instance ||
      Math.random().toString(36).slice(2,8)

    ;(window as any).__kore_preview_instance = id
    ;(window as any).__kore_preview_active = id

    instanceRef.current = id

    loadPreview("mount")

    const handler = () => loadPreview("fs-change")

    window.addEventListener("korelumina:fs-change", handler)

    return () => {
      window.removeEventListener("korelumina:fs-change", handler)
    }

  }, [projectId])

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin"
    />
  )
}
