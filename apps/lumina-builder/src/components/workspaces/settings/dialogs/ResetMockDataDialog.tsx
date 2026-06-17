import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RotateCcw } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";

type Props = {
  open: boolean;
  resetting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function ResetMockDataDialog({
  open,
  resetting,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="glass-strong border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-destructive" />
            Reset local mock data
          </DialogTitle>

          <DialogDescription>
            Clears local projects, usage,
            billing data, notifications,
            and seeded workspace content.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <LuminaButton
            variant="ghost"
            disabled={resetting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </LuminaButton>

          <LuminaButton
            variant="destructive"
            disabled={resetting}
            onClick={onConfirm}
          >
            {resetting
              ? "Resetting..."
              : "Reset data"}
          </LuminaButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
