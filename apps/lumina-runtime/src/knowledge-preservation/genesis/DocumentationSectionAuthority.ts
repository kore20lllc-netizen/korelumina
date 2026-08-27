import type {
  HistoricalSourceAuthority,
} from "./HistoricalSource.js";


export type DocumentationSectionCurrentAuthority =
  | "CURRENT_GOVERNING"
  | "CURRENT_SUPPORTING"
  | "HISTORICAL_VALID"
  | "SUPERSEDED"
  | "CONFLICTED"
  | "UNRESOLVED";


export interface DocumentationSectionAuthorityDeclaration {
  repositoryRelativePath:
    string;

  sectionSlug:
    string;

  currentAuthority:
    DocumentationSectionCurrentAuthority;

  authority?:
    HistoricalSourceAuthority;

  basis:
    readonly string[];
}


export function documentationSectionAuthorityKey(
  repositoryRelativePath:
    string,

  sectionSlug:
    string,
): string {
  const path =
    repositoryRelativePath
      .replaceAll(
        "\\",
        "/",
      )
      .replace(
        /^\.\//,
        "",
      )
      .trim();

  const slug =
    sectionSlug
      .trim()
      .toLowerCase();

  return `${path}#${slug}`;
}


export function sectionAuthorityMaySeed(
  declaration:
    DocumentationSectionAuthorityDeclaration |
    undefined,
): boolean {
  if (
    !declaration
  ) {
    return false;
  }

  if (
    declaration.currentAuthority !==
      "CURRENT_GOVERNING" &&
    declaration.currentAuthority !==
      "CURRENT_SUPPORTING"
  ) {
    return false;
  }

  const authority =
    declaration.authority;

  return Boolean(
    authority &&
    authority.authorityClass
      ?.trim() &&
    authority.approvalState ===
      "Approved" &&
    authority.owner
      ?.trim() &&
    authority.scope
      ?.trim() &&
    authority.version
      ?.trim(),
  );
}
