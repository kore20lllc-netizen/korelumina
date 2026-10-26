import { LuminaExecutiveCard } from "@/components/design-system/lumina";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DeploymentsTab() {
  return (
    <LuminaExecutiveCard variant="detail" title="Deployments" className="min-w-0 text-white">
        <div className="max-h-[600px] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-sm text-muted-foreground py-8"
            >
              Deployment history requires a runtime-backed deployment service.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
        </div>
    </LuminaExecutiveCard>
  );
}
