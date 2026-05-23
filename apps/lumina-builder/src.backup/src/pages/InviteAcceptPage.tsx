import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Check, X, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { team as teamProvider } from "@/providers/registry";
import { useCurrentUser } from "@/hooks/use-auth";
import { rememberIntendedPath } from "@/components/RequireAuth";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { normalizeError } from "@/lib/errors";
import type { Invitation, Team } from "@/providers/types";
import { roleLabel } from "@/services/teamPermissions";

const ACTIVE_KEY = "korelumina:activeTeam";

export default function InviteAcceptPage() {
  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => teamProvider.onChange(() => setTick((t) => t + 1)), []);

  const { invitation, team } = useMemo<{ invitation: Invitation | null; team: Team | null }>(() => {
    const inv = teamProvider.getInvitationByToken(token);
    const t = inv ? teamProvider.getTeam(inv.teamId) : null;
    return { invitation: inv, team: t };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tick]);

  const expired = invitation && invitation.expiresAt < Date.now();
  const wrongEmail =
    !!user && !!invitation && user.email.toLowerCase() !== invitation.email.toLowerCase();

  const accept = async () => {
    if (!invitation) return;
    if (!user) {
      rememberIntendedPath(`/invite/${token}`);
      navigate("/");
      toast("Sign in to accept the invitation.");
      return;
    }
    if (wrongEmail) {
      toast.error("Sign in with the invited email address.");
      return;
    }
    setBusy(true);
    try {
      const { team } = teamProvider.acceptInvitation(token, { id: user.id, email: user.email });
      try { window.localStorage.setItem(ACTIVE_KEY, team.id); } catch {}
      toast.success(`Joined ${team.name}`);
      navigate("/");
    } catch (e) {
      toast.error(normalizeError(e).userMessage);
    } finally {
      setBusy(false);
    }
  };

  const reject = () => {
    if (!invitation) return;
    setBusy(true);
    try {
      teamProvider.revokeInvitation(invitation.id);
      toast("Invitation declined");
      navigate("/");
    } catch (e) {
      toast.error(normalizeError(e).userMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md glass rounded-2xl border border-border p-7">
        <div className="h-10 w-10 rounded-xl bg-surface-2 grid place-items-center ring-1 ring-white/10 mb-4">
          <Mail className="h-4 w-4 text-muted-foreground" />
        </div>

        {!invitation ? (
          <>
            <h1 className="font-display text-xl tracking-tight">Invitation not found</h1>
            <p className="text-[13px] text-muted-foreground mt-2">
              This invite link is invalid, has been revoked, or was already used.
            </p>
            <div className="pt-5">
              <Link to="/">
                <LuminaButton variant="ghost" size="sm">Back to home <ArrowRight className="h-3 w-3" /></LuminaButton>
              </Link>
            </div>
          </>
        ) : expired || invitation.status !== "pending" ? (
          <>
            <h1 className="font-display text-xl tracking-tight">
              {expired ? "Invitation expired" : "Invitation unavailable"}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-2">
              Ask {team?.name ? `the ${team.name} owner` : "the workspace owner"} to send a new invite.
            </p>
            <div className="pt-5">
              <Link to="/">
                <LuminaButton variant="ghost" size="sm">Back to home <ArrowRight className="h-3 w-3" /></LuminaButton>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Workspace invitation</div>
            <h1 className="font-display text-2xl tracking-tight mt-1">
              Join {team?.name ?? "this workspace"}
            </h1>
            <p className="text-[13px] text-muted-foreground mt-2">
              You've been invited as <span className="text-foreground font-medium">{roleLabel(invitation.role)}</span> via{" "}
              <span className="text-foreground">{invitation.email}</span>.
            </p>

            {!user && (
              <div className="mt-4 rounded-xl bg-surface-1 border border-border p-3 text-[12px] text-muted-foreground">
                Sign in with <span className="text-foreground">{invitation.email}</span> to continue.
              </div>
            )}
            {wrongEmail && (
              <div className="mt-4 rounded-xl bg-surface-1 border border-border p-3 text-[12px] text-muted-foreground">
                You're signed in as <span className="text-foreground">{user!.email}</span>. Switch accounts to accept.
              </div>
            )}

            <div className="flex items-center gap-2 pt-5">
              <LuminaButton size="md" onClick={accept} disabled={busy || wrongEmail}>
                <Check className="h-3 w-3" /> {user ? "Accept invitation" : "Sign in to accept"}
              </LuminaButton>
              <LuminaButton variant="ghost" size="md" onClick={reject} disabled={busy}>
                <X className="h-3 w-3" /> Decline
              </LuminaButton>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
