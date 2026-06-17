import { Trash2 } from "lucide-react";

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
  resetting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function AdminResetDataDialog({
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
            <Trash2 className="h-5 w-5 text-destructive" />
            Reset all data
          </DialogTitle>

          <DialogDescription>
            Permanently wipes all local application data.
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
              : "Reset all data"}
          </LuminaButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
