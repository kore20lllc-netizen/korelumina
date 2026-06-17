import { LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LuminaButton } from "@/components/lumina/LuminaButton";

type Props = {
  open: boolean;
  workspaceName: string;
  leaving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function LeaveWorkspaceDialog({
  open,
  workspaceName,
  leaving,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Leave workspace
          </DialogTitle>

          <DialogDescription>
            Leave <strong>{workspaceName}</strong>.
            You will lose access until invited again.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <LuminaButton
            variant="ghost"
            disabled={leaving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </LuminaButton>

          <LuminaButton
            variant="destructive"
            disabled={leaving}
            onClick={onConfirm}
          >
            {leaving ? "Leaving..." : "Leave workspace"}
          </LuminaButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
