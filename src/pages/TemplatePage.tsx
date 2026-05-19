import Index from "./index";

/*
  Stable fallback for /templates/:slug

  Purpose:
  Prevent runtime errors from TemplatesMarketplace, which depends on
  WorkspaceProvider and other app context not mounted on this route.

  Behavior:
  - Keeps the URL as /templates/:slug
  - Renders the landing page content
  - Avoids all runtime/context dependency errors
*/

export default function TemplatePage() {
  return <Index />;
}
