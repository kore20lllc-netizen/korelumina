import { Suspense } from "react";
import BuilderClient from "./BuilderClient";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading builder...</div>}>
      <BuilderClient />
    </Suspense>
  );
}
