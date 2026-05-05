import { useEffect, useRef } from "react";

interface PreviewFrameProps {
  url: string;
}

export default function PreviewFrame({ url }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!url) return;

    async function run() {
      try {
        // FULL APP MODE (Next/Vite runtime)
        if (url.startsWith("http")) {
  if (iframeRef.current) {
    // force fresh + avoid stale cache
    const finalUrl = url.includes("?")
      ? `${url}&t=${Date.now()}`
      : `${url}?t=${Date.now()}`;

    iframeRef.current.src = finalUrl;
  }
  return;
}

        const doc = iframe.contentDocument;
        if (!doc) return;

        doc.open();
        doc.write(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>KoreLumina Preview</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #0b0f19;
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
      }
      #root {
        width: 100%;
        height: 100vh;
      }
      #error {
        white-space: pre-wrap;
        color: #ff6b6b;
        padding: 16px;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>

    <script>
      try {
        ${js}
      } catch (err) {
        const el = document.createElement("div");
        el.id = "error";
        el.innerText = err?.stack || err?.message || err;
        document.body.appendChild(el);
      }
    </script>
  </body>
</html>
        `);
        doc.close();
      } catch (err) {
        console.error("Preview failed:", err);
      }
    }

    run();
  }, [url]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}
