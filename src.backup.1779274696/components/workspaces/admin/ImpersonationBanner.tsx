import { useEffect, useState } from "react";
import { auth } from "@/providers/registry";
import { getImpersonatedUserId, stopImpersonation } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Crown, X } from "lucide-react";
import { toast } from "sonner";

export function ImpersonationBanner() {
  const [active, setActive] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const refresh = () => {
      const id = getImpersonatedUserId();
      setActive(id);
      setEmail(auth.getUser()?.email ?? "");
    };
    refresh();
    const off = auth.onChange(refresh);
    window.addEventListener("storage", refresh);
    return () => { off(); window.removeEventListener("storage", refresh); };
  }, []);

  if (!active) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] glass-strong border-b border-amber-400/40 px-4 py-2 flex items-center gap-3 text-sm">
      <Crown className="h-4 w-4 text-amber-400" />
      <span className="text-foreground">
        Impersonating <strong className="font-semibold">{email || active}</strong>
      </span>
      <div className="flex-1" />
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          stopImpersonation();
          toast.success("Exited impersonation");
          setTimeout(() => window.location.reload(), 200);
        }}
      >
        <X className="h-3.5 w-3.5 mr-1" /> Exit Impersonation
      </Button>
    </div>
  );
}