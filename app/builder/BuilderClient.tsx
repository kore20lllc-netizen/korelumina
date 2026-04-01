"use client";

import { useSearchParams } from "next/navigation";
import BuilderInner from "./BuilderInner";

export default function BuilderClient() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "demo-project";

  return <BuilderInner projectId={projectId} />;
}
