import { Suspense } from "react";
import PreviewClient from "@/components/preview/PreviewClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding:40}}>Loading preview…</div>}>
      <PreviewClient />
    </Suspense>
  );
}
