import {
  createHash,
} from "node:crypto";

import {
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";

import path from "node:path";

import type {
  GenesisConversationSpeakerRole,
  GenesisHistoricalConversationInput,
} from "./GenesisConversationAcquisition.js";

import type {
  GenesisConversationAcquisitionSnapshot,
  GenesisHistoricalConversationSource,
} from "./GenesisHistoricalConversationSourceAdapter.js";


export const CHATGPT_BROWSER_RECOVERY_SNAPSHOT_VERSION =
  "chatgpt-browser-recovery:v1" as const;


export interface ChatGPTBrowserRecoveryMessage {
  messageId:
    string;

  role:
    GenesisConversationSpeakerRole;

  order:
    number;

  timestamp?:
    number;

  content:
    string;

  sourceLocator?:
    string;
}


export interface ChatGPTBrowserRecoveryConversationSnapshot {
  snapshotVersion:
    typeof CHATGPT_BROWSER_RECOVERY_SNAPSHOT_VERSION;

  conversationId:
    string;

  title:
    string;

  conversationUrl:
    string;

  projectId?:
    string;

  capturedAt:
    number;

  messages:
    readonly ChatGPTBrowserRecoveryMessage[];
}


export interface ChatGPTBrowserRecoverySourceOptions {
  recoveryRoot:
    string;

  sourceId?:
    string;

  acquiredAt?:
    () => number;
}


function sha256(
  value:
    string,
): string {
  return (
    "sha256:" +
    createHash(
      "sha256",
    )
      .update(
        value,
        "utf8",
      )
      .digest(
        "hex",
      )
  );
}


function stableNormalize(
  value:
    unknown,
): unknown {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value.map(
      stableNormalize,
    );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const record =
      value as Record<
        string,
        unknown
      >;

    return Object.fromEntries(
      Object.keys(
        record,
      )
        .sort()
        .map(
          key => [
            key,
            stableNormalize(
              record[key],
            ),
          ],
        ),
    );
  }

  return value;
}


function stableHash(
  value:
    unknown,
): string {
  return sha256(
    JSON.stringify(
      stableNormalize(
        value,
      ),
    ),
  );
}


function requireString(
  value:
    unknown,

  error:
    string,
): string {
  if (
    typeof value !==
      "string" ||
    value.trim().length ===
      0
  ) {
    throw new Error(
      error,
    );
  }

  return value.trim();
}


function requireTimestamp(
  value:
    unknown,

  error:
    string,
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    throw new Error(
      error,
    );
  }

  return Math.round(
    value,
  );
}


function requireOrder(
  value:
    unknown,
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isSafeInteger(
      value,
    ) ||
    value <
      0
  ) {
    throw new Error(
      "genesis_browser_recovery_message_order_invalid",
    );
  }

  return value;
}


function role(
  value:
    unknown,
): GenesisConversationSpeakerRole {
  switch (
    value
  ) {
    case "user":
    case "assistant":
    case "system":
    case "developer":
    case "tool":
    case "unknown":
      return value;

    default:
      throw new Error(
        "genesis_browser_recovery_message_role_invalid",
      );
  }
}


function validateConversationUrl(
  value:
    string,
): string {
  let parsed:
    URL;

  try {
    parsed =
      new URL(
        value,
      );
  } catch {
    throw new Error(
      "genesis_browser_recovery_conversation_url_invalid",
    );
  }

  if (
    parsed.protocol !==
      "https:" ||
    parsed.hostname !==
      "chatgpt.com"
  ) {
    throw new Error(
      "genesis_browser_recovery_conversation_url_untrusted",
    );
  }

  if (
    !/(?:^|\/)c\/[^/]+/.test(
      parsed.pathname,
    )
  ) {
    throw new Error(
      "genesis_browser_recovery_conversation_url_not_conversation",
    );
  }

  return parsed.toString();
}


function parseSnapshot(
  file:
    string,
): ChatGPTBrowserRecoveryConversationSnapshot {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        readFileSync(
          file,
          "utf8",
        ),
      );
  } catch (
    error
  ) {
    throw new Error(
      `genesis_browser_recovery_snapshot_json_invalid:${path.basename(file)}`,
      {
        cause:
          error,
      },
    );
  }

  if (
    !parsed ||
    typeof parsed !==
      "object" ||
    Array.isArray(
      parsed,
    )
  ) {
    throw new Error(
      "genesis_browser_recovery_snapshot_invalid",
    );
  }

  const record =
    parsed as Record<
      string,
      unknown
    >;

  if (
    record.snapshotVersion !==
      CHATGPT_BROWSER_RECOVERY_SNAPSHOT_VERSION
  ) {
    throw new Error(
      "genesis_browser_recovery_snapshot_version_invalid",
    );
  }

  const conversationId =
    requireString(
      record.conversationId,
      "genesis_browser_recovery_conversation_id_required",
    );

  const title =
    requireString(
      record.title,
      "genesis_browser_recovery_title_required",
    );

  const conversationUrl =
    validateConversationUrl(
      requireString(
        record.conversationUrl,
        "genesis_browser_recovery_conversation_url_required",
      ),
    );

  const capturedAt =
    requireTimestamp(
      record.capturedAt,
      "genesis_browser_recovery_captured_at_invalid",
    );

  const projectId =
    record.projectId ===
      undefined
      ? undefined
      : requireString(
          record.projectId,
          "genesis_browser_recovery_project_id_invalid",
        );

  if (
    !Array.isArray(
      record.messages,
    )
  ) {
    throw new Error(
      "genesis_browser_recovery_messages_required",
    );
  }

  const seenMessageIds =
    new Set<string>();

  const seenOrders =
    new Set<number>();

  const messages =
    record.messages
      .map(
        raw => {
          if (
            !raw ||
            typeof raw !==
              "object" ||
            Array.isArray(
              raw,
            )
          ) {
            throw new Error(
              "genesis_browser_recovery_message_invalid",
            );
          }

          const message =
            raw as Record<
              string,
              unknown
            >;

          const messageId =
            requireString(
              message.messageId,
              "genesis_browser_recovery_message_id_required",
            );

          if (
            seenMessageIds.has(
              messageId,
            )
          ) {
            throw new Error(
              "genesis_browser_recovery_duplicate_message_id",
            );
          }

          seenMessageIds.add(
            messageId,
          );

          const order =
            requireOrder(
              message.order,
            );

          if (
            seenOrders.has(
              order,
            )
          ) {
            throw new Error(
              "genesis_browser_recovery_duplicate_message_order",
            );
          }

          seenOrders.add(
            order,
          );

          const messageRole =
            role(
              message.role,
            );

          const content =
            typeof message.content ===
              "string"
              ? message.content
              : (() => {
                  throw new Error(
                    "genesis_browser_recovery_message_content_required",
                  );
                })();

          const timestamp =
            message.timestamp ===
              undefined
              ? undefined
              : requireTimestamp(
                  message.timestamp,
                  "genesis_browser_recovery_message_timestamp_invalid",
                );

          const sourceLocator =
            message.sourceLocator ===
              undefined
              ? undefined
              : requireString(
                  message.sourceLocator,
                  "genesis_browser_recovery_message_source_locator_invalid",
                );

          return {
            messageId,
            role:
              messageRole,
            order,
            timestamp,
            content,
            sourceLocator,
          };
        },
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.order -
          right.order,
      );

  return {
    snapshotVersion:
      CHATGPT_BROWSER_RECOVERY_SNAPSHOT_VERSION,

    conversationId,

    title,

    conversationUrl,

    projectId,

    capturedAt,

    messages,
  };
}


function snapshotFiles(
  recoveryRoot:
    string,
): string[] {
  const root =
    realpathSync(
      recoveryRoot,
    );

  const info =
    statSync(
      root,
    );

  if (
    !info.isDirectory()
  ) {
    throw new Error(
      "genesis_browser_recovery_root_must_be_directory",
    );
  }

  return readdirSync(
    root,
    {
      withFileTypes:
        true,
    },
  )
    .filter(
      entry =>
        entry.isFile() &&
        /^conversation-.*\.json$/i.test(
          entry.name,
        ),
    )
    .map(
      entry =>
        path.join(
          root,
          entry.name,
        ),
    )
    .sort();
}


function toHistoricalConversation(
  snapshot:
    ChatGPTBrowserRecoveryConversationSnapshot,

  acquiredAt:
    number,
): GenesisHistoricalConversationInput {
  const sourceRevision =
    stableHash(
      snapshot,
    );

  return {
    conversationId:
      snapshot.conversationId,

    projectId:
      snapshot.projectId,

    title:
      snapshot.title,

    createdAt:
      snapshot.messages
        .map(
          message =>
            message.timestamp,
        )
        .filter(
          (
            value,
          ): value is number =>
            value !==
            undefined,
        )
        .sort(
          (
            left,
            right,
          ) =>
            left -
            right,
        )[0],

    updatedAt:
      snapshot.messages
        .map(
          message =>
            message.timestamp,
        )
        .filter(
          (
            value,
          ): value is number =>
            value !==
            undefined,
        )
        .sort(
          (
            left,
            right,
          ) =>
            right -
            left,
        )[0],

    sourceRevision,

    acquisition: {
      provider:
        "chatgpt-authenticated-browser",

      acquisitionMethod:
        "chatgpt-browser-dom-recovery-v1",

      acquiredAt,

      sourceLocator:
        snapshot.conversationUrl,

      exportId:
        sourceRevision,

      exportRevision:
        sourceRevision,
    },

    privacy: {
      sensitivity:
        "sensitive",

      containsPersonalData:
        true,

      handlingNotes: [
        "Recovered from the user's authenticated ChatGPT browser session.",
        "Browser recovery is evidence acquisition and does not certify Day-0 completeness.",
        "Official ChatGPT export may later corroborate or supersede this recovery source.",
      ],
    },

    messages:
      snapshot.messages.map(
        message => ({
          messageId:
            message.messageId,

          role:
            message.role,

          order:
            message.order,

          timestamp:
            message.timestamp,

          content:
            message.content,

          availability:
            "available",

          sourceLocator:
            message.sourceLocator ??
            `${snapshot.conversationUrl}#message=${encodeURIComponent(
              message.messageId,
            )}`,

          metadata: {
            recoveryMethod:
              "authenticated-browser-dom",

            conversationId:
              snapshot.conversationId,

            snapshotVersion:
              snapshot.snapshotVersion,

            capturedAt:
              snapshot.capturedAt,
          },
        }),
      ),
  };
}


export class ChatGPTBrowserRecoverySource
  implements
    GenesisHistoricalConversationSource
{
  readonly id:
    string;

  private readonly recoveryRoot:
    string;

  private readonly acquiredAt:
    () => number;


  constructor(
    options:
      ChatGPTBrowserRecoverySourceOptions,
  ) {
    this.recoveryRoot =
      options.recoveryRoot;

    this.id =
      options.sourceId ??
      "chatgpt-browser-recovery";

    this.acquiredAt =
      options.acquiredAt ??
      (() =>
        Date.now());
  }


  async acquire():
    Promise<
      GenesisConversationAcquisitionSnapshot
    > {
    const acquiredAt =
      this.acquiredAt();

    const files =
      snapshotFiles(
        this.recoveryRoot,
      );

    if (
      files.length ===
        0
    ) {
      throw new Error(
        "genesis_browser_recovery_snapshots_missing",
      );
    }

    const snapshots =
      files.map(
        parseSnapshot,
      );

    const seen =
      new Map<
        string,
        string
      >();

    const conversations:
      GenesisHistoricalConversationInput[] =
        [];

    for (
      const snapshot
      of snapshots
    ) {
      const normalized =
        toHistoricalConversation(
          snapshot,
          acquiredAt,
        );

      const revision =
        normalized.sourceRevision ??
        "";

      const existing =
        seen.get(
          normalized.conversationId,
        );

      if (
        existing
      ) {
        if (
          existing !==
            revision
        ) {
          throw new Error(
            `genesis_browser_recovery_duplicate_conversation_conflict:${normalized.conversationId}`,
          );
        }

        continue;
      }

      seen.set(
        normalized.conversationId,
        revision,
      );

      conversations.push(
        normalized,
      );
    }

    conversations.sort(
      (
        left,
        right,
      ) =>
        left.conversationId.localeCompare(
          right.conversationId,
        ),
    );

    const acquisitionId =
      "chatgpt-browser-recovery-acquisition:" +
      stableHash({
        conversations:
          conversations.map(
            conversation => ({
              conversationId:
                conversation.conversationId,

              sourceRevision:
                conversation.sourceRevision,
            }),
          ),
      }).replace(
        /^sha256:/,
        "",
      );

    return {
      acquisitionId,

      acquiredAt,

      conversations,

      /*
       * Browser recovery proves only what was successfully recovered.
       * Absence must never be interpreted as historical non-existence.
       */
      gaps:
        [],
    };
  }
}
