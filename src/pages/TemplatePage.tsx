import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";

const TemplatePageContent = lazy(() => import("./Index"));

export default function TemplatePage() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <Suspense fallback={null}>
      <TemplatePageContent key={slug} />
    </Suspense>
  );
}
