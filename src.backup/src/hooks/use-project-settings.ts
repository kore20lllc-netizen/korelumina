import { useEffect, useState } from "react";
import {
  getProjectName,
  getProjectSlug,
  getPreviewUrl,
  subscribeProjectSettings,
} from "@/lib/projectSettings";

export function useProjectSettings() {
  const [name, setName] = useState(getProjectName);
  const [slug, setSlug] = useState(getProjectSlug);
  useEffect(
    () =>
      subscribeProjectSettings(() => {
        setName(getProjectName());
        setSlug(getProjectSlug());
      }),
    [],
  );
  return { name, slug, previewUrl: getPreviewUrl(slug) };
}