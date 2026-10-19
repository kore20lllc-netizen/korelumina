/*
 * SEC-1 (F-18): the environment given to processes that run a customer's
 * project code (dependency install, health checks, the dev server).
 *
 * Runtime's own environment holds secrets: AI provider keys, the Runtime
 * internal token, deployment and repository credentials. Spreading it
 * into a project process handed every one of them to code KoreLumina did
 * not write. Project processes now get an allowlist: only what tools need
 * to find themselves, write temporary files, format text, and reach the
 * package registry. Everything else, secrets included, stays in Runtime.
 *
 * Private registry credentials keep working through the user's own
 * ~/.npmrc, which npm reads from HOME; they are never copied from
 * Runtime's environment (npm_config_*, NPM_TOKEN and similar are dropped).
 */

const PASSTHROUGH = new Set([
  /* Finding tools and the user's home */
  "PATH",
  "HOME",
  "USER",
  "LOGNAME",
  "SHELL",
  "NVM_DIR",
  "NVM_BIN",
  "PNPM_HOME",
  "BUN_INSTALL",
  "COREPACK_HOME",
  "VOLTA_HOME",
  "XDG_CACHE_HOME",
  "XDG_CONFIG_HOME",
  "XDG_DATA_HOME",
  /* Temporary files, locale, terminal, time zone */
  "TMPDIR",
  "TMP",
  "TEMP",
  "LANG",
  "LANGUAGE",
  "TERM",
  "COLORTERM",
  "TZ",
  /* Reaching the package registry from behind a proxy or custom CA */
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "no_proxy",
  "NODE_EXTRA_CA_CERTS",
  "SSL_CERT_FILE",
  "SSL_CERT_DIR",
  /* Windows system paths */
  "SystemRoot",
  "SYSTEMROOT",
  "ComSpec",
  "COMSPEC",
  "windir",
  "WINDIR",
  "PATHEXT",
  "APPDATA",
  "LOCALAPPDATA",
  "USERPROFILE",
  "ProgramFiles",
  "ProgramData",
]);

function passesThrough(name: string): boolean {
  return PASSTHROUGH.has(name) || name.startsWith("LC_");
}

export function projectProcessEnvironment(
  overrides: Readonly<Record<string, string>>,
  source: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {};

  for (const [name, value] of Object.entries(source)) {
    if (value !== undefined && passesThrough(name)) {
      environment[name] = value;
    }
  }

  return {
    ...environment,
    ...overrides,
  };
}
