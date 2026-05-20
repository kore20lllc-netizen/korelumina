import { NotImplementedError } from "@/lib/errors";
import type { AuthProvider } from "@/providers/types";

const nope = (n: string): never => { throw new NotImplementedError(`SupabaseAuthProvider.${n}`); };

/** Stub — swap in by changing providers/registry.ts. Real implementation
 *  wraps supabase.auth.* and onAuthStateChange. */
export class SupabaseAuthProvider implements AuthProvider {
  getSession() { return null; }
  getUser() { return null; }
  async signUp(): ReturnType<AuthProvider["signUp"]> { return nope("signUp"); }
  async signIn(): ReturnType<AuthProvider["signIn"]> { return nope("signIn"); }
  async signOut() { nope("signOut"); }
  async resetPassword() { nope("resetPassword"); }
  async updateProfile(): ReturnType<AuthProvider["updateProfile"]> { return nope("updateProfile"); }
  async changePassword() { nope("changePassword"); }
  async setRole(): ReturnType<AuthProvider["setRole"]> { return nope("setRole"); }
  onChange() { return () => {}; }
}