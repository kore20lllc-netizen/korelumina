import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { LuminaButton } from "@/components/lumina/LuminaButton";

type UserSummary = {
  id: string;
  email: string;
};

type Props = {
  open: boolean;
  user: UserSummary | null;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function AdminUserDeleteDialog({
  open,
  user,
  deleting,
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
            Delete user
          </DialogTitle>

          <DialogDescription>
            Permanently delete
            {" "}
            <strong>
              {user?.email}
            </strong>
            .
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <LuminaButton
            variant="ghost"
            onClick={() =>
              onOpenChange(false)
            }
            disabled={deleting}
          >
            Cancel
          </LuminaButton>

          <LuminaButton
            variant="destructive"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting
              ? "Deleting..."
              : "Delete user"}
          </LuminaButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
