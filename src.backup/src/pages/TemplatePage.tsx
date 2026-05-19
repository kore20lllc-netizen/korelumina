import { useParams, Navigate } from "react-router-dom";
import { TemplateShell } from "@/components/templates/TemplateShell";
import { getTemplateBySlug } from "@/components/templates/registry";

export default function TemplatePage() {
  const { slug } = useParams();
  const template = getTemplateBySlug(slug);
  if (!template) return <Navigate to="/" replace />;
  const Component = template.Component;
  return (
    <TemplateShell template={template}>
      <Component />
    </TemplateShell>
  );
}