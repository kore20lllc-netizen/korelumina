import { useState } from "react";
import { Sparkles, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { LuminaButton } from "@/components/lumina/LuminaButton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { auth } from "@/providers/auth-registry";
import { normalizeError } from "@/lib/errors";
import { logAction } from "@/services/auditLogService";

type Tab = "signin" | "signup" | "forgot";

export function AuthView() {
  const { setView } = useWorkspace();
  const [tab, setTab] = useState<Tab>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (tab === "signin") {
        await auth.signIn({ email, password });
        logAction("auth.sign_in", { metadata: { email } });
        toast.success("Signed in");
        setView("dashboard");
      } else if (tab === "signup") {
        await auth.signUp({ email, password, name });
        logAction("auth.sign_up", { metadata: { email } });
        toast.success("Account created");
        setView("dashboard");
      } else {
        await auth.resetPassword(email);
        toast.success("If that email exists, a reset link is on its way.");
        setTab("signin");
      }
    } catch (err) {
      const ae = normalizeError(err);
      toast.error(ae.userMessage);
    } finally {
      setBusy(false);
    }
  };

  const googleContinue = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Mock social login: create-or-sign-in a demo Google account.
      const demoEmail = "google.demo@lumina.app";
      try { await auth.signIn({ email: demoEmail, password: "google-demo-pass" }); }
      catch { await auth.signUp({ email: demoEmail, password: "google-demo-pass", name: "Google User" }); }
      toast.success("Continuing with Google");
      setView("dashboard");
    } catch (err) {
      toast.error(normalizeError(err).userMessage);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex-1 grid place-items-center px-4 py-12">
      <div className="w-full max-w-md glass rounded-2xl p-8 anim-in">
        <button onClick={() => setView("entry")} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-violet" />
          <h1 className="font-display font-bold text-3xl tracking-tight">
            Kore<span className="text-gradient-lumina">Lumina</span>
          </h1>
        </div>
        <p className="text-[13px] text-muted-foreground mb-6">
          {tab === "signin" ? "Welcome back." : tab === "signup" ? "Create your account." : "We’ll email you a reset link."}
        </p>

        <div className="grid grid-cols-3 p-0.5 rounded-lg bg-surface-1 border border-border text-[11px] mb-5">
          {(["signin", "signup", "forgot"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "h-7 rounded-md transition capitalize",
                tab === t ? "bg-surface-3 text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "signin" ? "Sign in" : t === "signup" ? "Sign up" : "Forgot"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {tab === "signup" && (
            <Field Icon={User} type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <Field Icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {tab !== "forgot" && (
            <Field Icon={Lock} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          )}
          <LuminaButton size="lg" className="w-full mt-2" type="submit" disabled={busy}>
            {busy ? "Working…" : tab === "signin" ? "Sign in" : tab === "signup" ? "Create account" : "Send reset link"}
          </LuminaButton>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <LuminaButton variant="ghost" size="lg" className="w-full" onClick={googleContinue} disabled={busy}>
          Continue with Google
        </LuminaButton>
      </div>
    </div>
  );
}

function Field({ Icon, ...rest }: { Icon: any } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-surface-1 border border-border focus-within:border-violet/50 transition">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <input {...rest} className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted-foreground/70" />
    </div>
  );
}