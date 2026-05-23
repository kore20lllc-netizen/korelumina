import { AppError } from "@/lib/errors";
import { readJSON, writeJSON, subscribe, uid } from "@/lib/persistence";
import type { AuthProvider, Role, Session, User } from "@/providers/types";

const NS = "auth";

interface StoredUser extends User { pwHash: string }

function hash(s: string): string {
  // Mock hash — deterministic but not crypto. Real provider uses Supabase.
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return `mh_${(h >>> 0).toString(16)}`;
}

function loadUsers(): StoredUser[] { return readJSON<StoredUser[]>(NS, "users", []); }
function saveUsers(u: StoredUser[]) { writeJSON(NS, "users", u); }
function loadSession(): Session | null { return readJSON<Session | null>(NS, "session", null); }
function saveSession(s: Session | null) { writeJSON(NS, "session", s); }
function loadImpersonation(): string | null { return readJSON<string | null>(NS, "impersonate", null); }
function saveImpersonation(id: string | null) { writeJSON(NS, "impersonate", id); }

function stripPw(u: StoredUser): User { const { pwHash: _pw, ...rest } = u; return rest; }

export function seedAdminUser() {
  const users = loadUsers();
  if (users.some((u) => u.email === "admin@lumina.app")) return;
  users.push({
    id: "usr_admin_seed",
    email: "admin@lumina.app",
    name: "Lumina Admin",
    role: "admin",
    createdAt: Date.now(),
    pwHash: hash("admin1234"),
  });
  saveUsers(users);
}

export function mockAllUsers(): User[] { return loadUsers().map(stripPw); }
export function mockUpdateUser(id: string, patch: Partial<StoredUser>) {
  const users = loadUsers();
  const i = users.findIndex((u) => u.id === id);
  if (i < 0) return;
  users[i] = { ...users[i], ...patch };
  saveUsers(users);
}
export function mockDeleteUser(id: string) { saveUsers(loadUsers().filter((u) => u.id !== id)); }
export function mockCreateUser(input: { email: string; name: string; role: Role; password?: string }): User {
  const users = loadUsers();
  const u: StoredUser = {
    id: uid("usr"), email: input.email.toLowerCase(), name: input.name,
    role: input.role, createdAt: Date.now(), pwHash: hash(input.password ?? "password1234"),
  };
  users.push(u); saveUsers(users);
  return stripPw(u);
}
export function mockSetImpersonation(userId: string | null) { saveImpersonation(userId); }
export function mockGetImpersonation(): string | null { return loadImpersonation(); }
export function mockResetPasswordTo(id: string, newPw: string) {
  const users = loadUsers();
  const i = users.findIndex((u) => u.id === id);
  if (i < 0) return;
  users[i].pwHash = hash(newPw);
  saveUsers(users);
}

export class MockAuthProvider implements AuthProvider {
  getSession() {
    const s = loadSession();
    if (!s) return null;
    if (s.expiresAt < Date.now()) { saveSession(null); return null; }
    return s;
  }
  getUser() {
    const s = this.getSession();
    if (!s) return null;
    const impId = loadImpersonation();
    const lookupId = impId ?? s.userId;
    const u = loadUsers().find((x) => x.id === lookupId);
    return u ? stripPw(u) : null;
  }
  async signUp({ email, password, name }: { email: string; password: string; name: string }) {
    email = email.trim().toLowerCase();
    if (!email.includes("@")) throw new AppError("VALIDATION", "Enter a valid email.");
    if (password.length < 8) throw new AppError("AUTH_WEAK_PASSWORD", "Password must be at least 8 characters.");
    const users = loadUsers();
    if (users.some((u) => u.email === email)) throw new AppError("AUTH_EMAIL_TAKEN", "An account with that email already exists.");
    const user: StoredUser = {
      id: uid("usr"), email, name: name.trim() || email.split("@")[0],
      role: "free", createdAt: Date.now(), pwHash: hash(password),
    };
    users.push(user); saveUsers(users);
    const session: Session = { userId: user.id, token: uid("tok"), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 };
    saveSession(session);
    return { user: stripPw(user), session };
  }
  async signIn({ email, password }: { email: string; password: string }) {
    email = email.trim().toLowerCase();
    const users = loadUsers();
    const u = users.find((x) => x.email === email);
    if (!u || u.pwHash !== hash(password)) throw new AppError("AUTH_INVALID_CREDENTIALS", "Invalid email or password.");
    const session: Session = { userId: u.id, token: uid("tok"), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 };
    saveSession(session);
    return { user: stripPw(u), session };
  }
  async signOut() { saveSession(null); }
  async resetPassword(email: string) {
    // Mock: pretend an email was sent. Don't reveal existence.
    await new Promise((r) => setTimeout(r, 250));
    if (!email.includes("@")) throw new AppError("VALIDATION", "Enter a valid email.");
  }
  async updateProfile(patch: Partial<Pick<User, "name" | "avatarUrl">>) {
    const s = this.getSession();
    if (!s) throw new AppError("AUTH_NOT_AUTHENTICATED", "Sign in to continue.");
    const users = loadUsers();
    const i = users.findIndex((u) => u.id === s.userId);
    if (i < 0) throw new AppError("NOT_FOUND", "Account not found.");
    users[i] = { ...users[i], ...patch };
    saveUsers(users);
    return stripPw(users[i]);
  }
  async changePassword(oldPw: string, newPw: string) {
    const s = this.getSession();
    if (!s) throw new AppError("AUTH_NOT_AUTHENTICATED", "Sign in to continue.");
    if (newPw.length < 8) throw new AppError("AUTH_WEAK_PASSWORD", "New password must be at least 8 characters.");
    const users = loadUsers();
    const i = users.findIndex((u) => u.id === s.userId);
    if (i < 0 || users[i].pwHash !== hash(oldPw)) throw new AppError("AUTH_INVALID_CREDENTIALS", "Current password is incorrect.");
    users[i].pwHash = hash(newPw);
    saveUsers(users);
  }
  async setRole(role: Role) {
    const s = this.getSession();
    if (!s) throw new AppError("AUTH_NOT_AUTHENTICATED", "Sign in to continue.");
    const users = loadUsers();
    const i = users.findIndex((u) => u.id === s.userId);
    if (i < 0) throw new AppError("NOT_FOUND", "Account not found.");
    users[i].role = role;
    saveUsers(users);
    return stripPw(users[i]);
  }
  onChange(cb: () => void) { return subscribe(NS, cb); }
}