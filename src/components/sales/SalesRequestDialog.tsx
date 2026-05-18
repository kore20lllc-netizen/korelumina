import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { toast } from "sonner";
import { useImeSafeKeyHandler } from "@/hooks/use-ime-safe-key-handler";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Short reason shown at the top of the form, e.g. "Repo Audit Engine access". */
  reason?: string;
  /** Pre-tagged source so we know which CTA opened the dialog. */
  source?: string;
}

export function SalesRequestDialog({ open, onOpenChange, reason, source }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userEditedMessage, setUserEditedMessage] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // History stacks for message resets. Each entry captures the message text
  // plus whether the user had edited it, so undo/redo restores both.
  type Snapshot = { message: string; edited: boolean };
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  // Counts mirror the ref-based stacks so the hint UI re-renders on changes.
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const syncCounts = () => {
    setUndoCount(undoStack.current.length);
    setRedoCount(redoStack.current.length);
  };

  // IME-safe wrapper for the textarea's Cmd/Ctrl+Z shortcut.
  const handleShortcut = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      if (document.activeElement !== e.currentTarget) return;
      if (e.shiftKey) {
        if (redoStack.current.length === 0) return;
        e.preventDefault();
        redoReset();
      } else {
        if (undoStack.current.length === 0) return;
        e.preventDefault();
        undoReset();
      }
    },
    [],
  );
  const imeSafeHandlers = useImeSafeKeyHandler<HTMLTextAreaElement>(handleShortcut);

  useEffect(() => {
    if (open && !userEditedMessage) {
      fillMessage();
    }
  }, [open, reason, source, userEditedMessage]);

  const buildTemplate = () => {
    const parts: string[] = [];
    if (reason) parts.push(`I'd like to request access to ${reason}.`);
    if (source) parts.push(`(Requested from: ${source})`);
    return parts.join(" ");
  };

  const fillMessage = () => {
    setMessage(buildTemplate());
  };

  const resetMessage = () => {
    if (!userEditedMessage) {
      fillMessage();
      return;
    }
    setConfirmResetOpen(true);
  };

  const confirmResetMessage = () => {
    undoStack.current.push({ message, edited: userEditedMessage });
    redoStack.current = [];
    setUserEditedMessage(false);
    fillMessage();
    setConfirmResetOpen(false);
    syncCounts();
    showHistoryToast("Message reset to template", "undo");
  };

  const undoReset = () => {
    const snap = undoStack.current.pop();
    if (!snap) return;
    redoStack.current.push({ message, edited: userEditedMessage });
    setMessage(snap.message);
    setUserEditedMessage(snap.edited);
    syncCounts();
    showHistoryToast("Reset undone", "redo");
  };

  const redoReset = () => {
    const snap = redoStack.current.pop();
    if (!snap) return;
    undoStack.current.push({ message, edited: userEditedMessage });
    setMessage(snap.message);
    setUserEditedMessage(snap.edited);
    syncCounts();
    showHistoryToast("Reset reapplied", "undo");
  };

  const showHistoryToast = (label: string, prefer: "undo" | "redo") => {
    const canUndo = undoStack.current.length > 0;
    const canRedo = redoStack.current.length > 0;
    const description = `${undoStack.current.length} undo · ${redoStack.current.length} redo available`;
    const useRedo = prefer === "redo" ? canRedo : !canUndo && canRedo;
    toast(label, {
      description,
      action: useRedo
        ? { label: "Redo", onClick: redoReset }
        : canUndo
          ? { label: "Undo", onClick: undoReset }
          : undefined,
    });
  };

  const reset = () => {
    setName("");
    setEmail("");
    setCompany("");
    setMessage("");
    setSubmitting(false);
    setUserEditedMessage(false);
    undoStack.current = [];
    redoStack.current = [];
    setUndoCount(0);
    setRedoCount(0);
  };

  const valid = name.trim().length > 0 && /\S+@\S+\.\S+/.test(email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    // No backend yet — simulate an async request so the UX feels real.
    await new Promise((r) => setTimeout(r, 600));
    toast.success("Sales request sent", {
      description: "Our team will follow up within one business day.",
    });
    onOpenChange(false);
    reset();
  };

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Talk to sales</DialogTitle>
          <DialogDescription>
            {reason ? `Request access to ${reason}. ` : ""}
            Tell us a little about your team and we'll be in touch shortly.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sales-name">Name</Label>
              <Input
                id="sales-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sales-email">Work email</Label>
              <Input
                id="sales-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sales-company">Company</Label>
            <Input
              id="sales-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme, Inc."
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="sales-message">What do you need?</Label>
              <button
                type="button"
                onClick={resetMessage}
                className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Reset message
              </button>
            </div>
            <Textarea
              id="sales-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setUserEditedMessage(true);
              }}
              {...imeSafeHandlers}
              placeholder="Briefly describe your use case…"
              rows={3}
            />
            {(undoCount > 0 || redoCount > 0) && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80">
                {undoCount > 0 && (
                  <span>
                    <kbd className="rounded border border-white/10 bg-surface-2 px-1 py-px font-mono text-[10px]">
                      ⌘/Ctrl+Z
                    </kbd>{" "}
                    undo ({undoCount})
                  </span>
                )}
                {undoCount > 0 && redoCount > 0 && <span className="opacity-40">·</span>}
                {redoCount > 0 && (
                  <span>
                    <kbd className="rounded border border-white/10 bg-surface-2 px-1 py-px font-mono text-[10px]">
                      ⌘/Ctrl+Shift+Z
                    </kbd>{" "}
                    redo ({redoCount})
                  </span>
                )}
              </div>
            )}
          </div>
          {source && (
            <input type="hidden" name="source" value={source} readOnly />
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <LuminaButton
              type="button"
              variant="outline"
              size="md"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </LuminaButton>
            <LuminaButton
              type="submit"
              variant="primary"
              size="md"
              disabled={!valid || submitting}
            >
              {submitting ? "Sending…" : "Send request"}
            </LuminaButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
      <AlertDialog open={confirmResetOpen} onOpenChange={setConfirmResetOpen}>
        <AlertDialogContent className="border-white/10 bg-surface-1/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display tracking-tight">
              Reset your message?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will replace what you've written with the default template based on the request context. Your edits can't be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-surface-2 border-white/10 hover:bg-surface-2/80 hover:text-foreground">
              Keep my message
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmResetMessage}
              className="bg-button-lumina text-white shadow-[0_4px_16px_-4px_hsl(var(--violet)/0.5),inset_0_1px_0_hsl(220_20%_100%/0.18)] hover:opacity-90"
            >
              Reset to template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}