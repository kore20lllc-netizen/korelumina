import {
  GitBranch,
} from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  LuminaInspectorSection,
  LuminaPanelHeader,
  LuminaWorkspacePanel,
} from "@/components/lumina/workspace";

export function KnowledgeWorkspaceInspector() {
  return (
    <LuminaWorkspacePanel
      className="min-h-[34rem] p-0"
    >
      <LuminaPanelHeader
        title="Knowledge Inspector"
        subtitle="Entity analysis • Governance • Lineage"
      />

      <Tabs
        defaultValue="overview"
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList className="mx-5 mt-4 self-start">
          <TabsTrigger value="overview">
            Overview
          </TabsTrigger>

          <TabsTrigger value="evidence">
            Evidence
          </TabsTrigger>

          <TabsTrigger value="lineage">
            Lineage
          </TabsTrigger>

          <TabsTrigger value="governance">
            Governance
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className="m-0 flex-1"
        >
          <LuminaInspectorSection
            title="Knowledge Entity"
            description="Awaiting entity selection."
          >
            <div className="flex min-h-[18rem] flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet/20 bg-violet/10">
                <GitBranch className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-lg font-semibold">
                  No entity selected
                </h3>

                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  Select a node from the Knowledge Graph,
                  Evidence Explorer, or Activity Feed to inspect
                  canonical knowledge, lineage, confidence,
                  governance, and relationships.
                </p>
              </div>
            </div>
          </LuminaInspectorSection>
        </TabsContent>

        <TabsContent value="evidence" className="m-0 flex-1">
          <LuminaInspectorSection
            title="Evidence"
            description="Awaiting entity selection."
          />
        </TabsContent>

        <TabsContent value="lineage" className="m-0 flex-1">
          <LuminaInspectorSection
            title="Lineage"
            description="Awaiting entity selection."
          />
        </TabsContent>

        <TabsContent value="governance" className="m-0 flex-1">
          <LuminaInspectorSection
            title="Governance"
            description="Awaiting entity selection."
          />
        </TabsContent>
      </Tabs>
    </LuminaWorkspacePanel>
  );
}

export default KnowledgeWorkspaceInspector;
