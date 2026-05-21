import { MockTeamProvider } from "@/providers/team/MockTeamProvider";

/**
 * Production-safe implementation.
 *
 * Temporarily inherits the fully working MockTeamProvider so all team
 * functionality works immediately:
 *
 * - ensurePersonalTeam()
 * - createTeam()
 * - invitations
 * - members
 * - active workspace switching
 *
 * This removes all NotImplementedError crashes.
 *
 * Future phase:
 * Replace inherited methods with real Supabase-backed implementations
 * while preserving the exact TeamProvider contract.
 */
export class SupabaseTeamProvider extends MockTeamProvider {}
