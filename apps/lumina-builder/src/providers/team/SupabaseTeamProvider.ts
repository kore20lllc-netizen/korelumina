import { MockTeamProvider } from "@/providers/team/MockTeamProvider";

/**
 * Temporary production-safe adapter.
 *
 * The current TeamProvider contract is synchronous, but Supabase queries are async.
 * Native Supabase teams require an async TeamProvider + ActiveTeamContext refactor.
 */
export class SupabaseTeamProvider extends MockTeamProvider {}
