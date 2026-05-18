import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import {
  getProjectName,
  getProjectSlug,
  setProjectName,
  setProjectSlug,
  slugify,
  validateSlug,
  PREVIEW_HOST,
} from "@/lib/projectSettings";
import { toast } from "sonner";
import { getCapabilities } from "@/services/workspaceAccessService";
import { useCurrentRole } from "@/hooks/use-current-role";
import { Lock } from "lucide-react";
import { UpgradeModal } from "@/components/preview/UpgradeModal";
import {
  setPendingUpgradeAction,
  getPendingUpgradeAction,
  clearPendingUpgradeAction,
} from "@/services/pendingUpgradeAction";

export function ProjectSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [role] = useCurrentRole();
  const caps = getCapabilities(role);
  const canCustomizeSlug = caps.customSlug;
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(getProjectName());
      setSlug(getProjectSlug());
      setSlugTouched(false);
    }
  }, [open]);

  // If user previously initiated a "slug" upgrade and now has the capability,
  // auto-focus the slug field when the dialog opens.
  useEffect(() => {
    if (!open || !canCustomizeSlug) return;
    const pending = getPendingUpgradeAction();
    if (pending?.reason !== "slug") return;
    clearPendingUpgradeAction();
    setTimeout(() => {
      const el = document.getElementById("proj-slug") as HTMLInputElement | null;
      el?.focus();
      el?.select();
    }, 80);
  }, [open, canCustomizeSlug]);

  // Auto-derive slug from name until user edits it manually.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  const error = validateSlug(slug);
  const previewUrl = `https://${PREVIEW_HOST}/${slug || "your-slug"}`;

  const handleSave = () => {
    if (error) return;
    setProjectName(name.trim() || "Untitled Project");
    setProjectSlug(slug);
    toast.success("Project settings saved");
    onOpenChange(false);
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Project Settings</DialogTitle>
          <DialogDescription>Rename your project and customize its preview URL.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Project Name</Label>
            <Input
              id="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="GroupHome OS"
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="proj-slug">Project Slug</Label>
              {!canCustomizeSlug && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-gold">
                  <Lock className="h-3 w-3" /> Pro
                </span>
              )}
            </div>
            <Input
              id="proj-slug"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value.toLowerCase());
              }}
              onFocus={() => {
                if (!canCustomizeSlug) {
                  setPendingUpgradeAction("slug", slug);
                  setUpgradeOpen(true);
                }
              }}
              placeholder="grouphome-os"
              maxLength={48}
              aria-invalid={!!error}
              disabled={!canCustomizeSlug}
            />
            {!canCustomizeSlug ? (
              <button
                type="button"
                onClick={() => {
                  setPendingUpgradeAction("slug", slug);
                  setUpgradeOpen(true);
                }}
                className="text-xs text-gold hover:underline text-left"
              >
                Custom slugs are available on Pro and Business plans — upgrade to unlock.
              </button>
            ) : error ? (
              <p className="text-xs text-destructive">{error}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Lowercase letters, numbers, hyphens.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Preview URL</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-10 px-3 rounded-md border border-input bg-background/50 text-sm flex items-center text-muted-foreground truncate">
                {previewUrl}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyUrl}
                aria-label="Copy preview URL"
              >
                {copied ? <Check className="h-4 w-4 text-cyan" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={canCustomizeSlug && !!error}>Save changes</Button>
        </DialogFooter>
        <UpgradeModal
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          reason="slug"
          onUpgraded={() => {
            clearPendingUpgradeAction();
            setTimeout(() => {
              const el = document.getElementById("proj-slug") as HTMLInputElement | null;
              el?.focus();
              el?.select();
            }, 60);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}