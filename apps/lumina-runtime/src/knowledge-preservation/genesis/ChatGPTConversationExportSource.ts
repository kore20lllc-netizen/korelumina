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


type JsonRecord =
  Record<
    string,
    unknown
  >;


export interface ChatGPTConversationExportSourceOptions {
  exportRoot:
    string;

  sourceId?:
    string;

  acquiredAt?:
    () => number;

  /*
   * Project/workspace association is intentionally externalized.
   *
   * OpenAI documents the export files but does not publish a
   * stable project-association schema for conversations.json.
   * KoreLumina therefore MUST NOT guess a project identity from
   * undocumented fields.
   */
  projectResolver?:
    (
      conversation:
        Readonly<JsonRecord>,
    ) =>
      string |
      undefined;
}


interface ExportFile {
  absolutePath:
    string;

  relativePath:
    string;

  content:
    string;

  checksum:
    string;
}


interface ConversationNode {
  nodeId:
    string;

  messageId:
    string;

  parentId:
    string | null;

  timestamp:
    number | undefined;

  rawTimestamp:
    unknown;

  role:
    GenesisConversationSpeakerRole;

  rawRole:
    unknown;

  content:
    string;

  rawMessage:
    JsonRecord;

  rawNode:
    JsonRecord;
}


function isRecord(
  value:
    unknown,
): value is JsonRecord {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}


function nonEmptyString(
  value:
    unknown,
): string | undefined {
  if (
    typeof value !==
      "string"
  ) {
    return undefined;
  }

  const normalized =
    value.trim();

  return normalized.length >
    0
    ? normalized
    : undefined;
}


function sha256(
  content:
    string,
): string {
  return (
    "sha256:" +
    createHash(
      "sha256",
    )
      .update(
        content,
        "utf8",
      )
      .digest(
        "hex",
      )
  );
}


function stableHash(
  value:
    unknown,
): string {
  function normalize(
    current:
      unknown,
  ): unknown {
    if (
      Array.isArray(
        current,
      )
    ) {
      return current.map(
        normalize,
      );
    }

    if (
      isRecord(
        current,
      )
    ) {
      return Object.fromEntries(
        Object.keys(
          current,
        )
          .sort()
          .map(
            (
              key,
            ) => [
              key,
              normalize(
                current[key],
              ),
            ],
          ),
      );
    }

    return current;
  }

  return sha256(
    JSON.stringify(
      normalize(
        value,
      ),
    ),
  );
}


function normalizeTimestamp(
  value:
    unknown,
): number | undefined {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    ) ||
    value <
      0
  ) {
    return undefined;
  }

  /*
   * ChatGPT exports historically use Unix seconds while other
   * integrations may expose milliseconds.
   *
   * Preserve the raw timestamp separately and normalize only the
   * Runtime chronology representation.
   */
  if (
    value <
      100_000_000_000
  ) {
    return Math.round(
      value *
      1000,
    );
  }

  return Math.round(
    value,
  );
}


function speakerRole(
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
      return value;

    default:
      return "unknown";
  }
}


function textContent(
  message:
    JsonRecord,
): string {
  const content =
    message.content;

  if (
    !isRecord(
      content,
    )
  ) {
    return "";
  }

  const parts =
    content.parts;

  if (
    !Array.isArray(
      parts,
    )
  ) {
    return "";
  }

  return parts
    .filter(
      (
        part,
      ): part is string =>
        typeof part ===
          "string",
    )
    .join(
      "\n",
    );
}


function conversationTitle(
  conversation:
    JsonRecord,

  conversationId:
    string,
): string {
  return (
    nonEmptyString(
      conversation.title,
    ) ??
    `ChatGPT conversation ${conversationId}`
  );
}


function conversationIdentity(
  conversation:
    JsonRecord,
): string {
  const id =
    nonEmptyString(
      conversation.id,
    );

  if (
    !id
  ) {
    throw new Error(
      "genesis_chatgpt_export_conversation_identity_required",
    );
  }

  return id;
}


function messageNodes(
  conversation:
    JsonRecord,
): ConversationNode[] {
  const mapping =
    conversation.mapping;

  if (
    !isRecord(
      mapping,
    )
  ) {
    throw new Error(
      "genesis_chatgpt_export_mapping_required",
    );
  }

  const result:
    ConversationNode[] =
      [];

  for (
    const [
      mappingKey,
      rawNode,
    ]
    of Object.entries(
      mapping,
    )
  ) {
    if (
      !isRecord(
        rawNode,
      )
    ) {
      continue;
    }

    const rawMessage =
      rawNode.message;

    if (
      !isRecord(
        rawMessage,
      )
    ) {
      continue;
    }

    const nodeId =
      nonEmptyString(
        rawNode.id,
      ) ??
      mappingKey;

    const messageId =
      nonEmptyString(
        rawMessage.id,
      ) ??
      nodeId;

    if (
      !messageId
    ) {
      throw new Error(
        "genesis_chatgpt_export_message_identity_required",
      );
    }

    const author =
      isRecord(
        rawMessage.author,
      )
        ? rawMessage.author
        : {};

    const rawRole =
      author.role;

    const rawTimestamp =
      rawMessage.create_time;

    result.push({
      nodeId,

      messageId,

      parentId:
        nonEmptyString(
          rawNode.parent,
        ) ??
        null,

      timestamp:
        normalizeTimestamp(
          rawTimestamp,
        ),

      rawTimestamp,

      role:
        speakerRole(
          rawRole,
        ),

      rawRole,

      content:
        textContent(
          rawMessage,
        ),

      rawMessage,

      rawNode,
    });
  }

  return result;
}


function orderedNodes(
  nodes:
    readonly ConversationNode[],
): ConversationNode[] {
  const byNodeId =
    new Map(
      nodes.map(
        (
          node,
        ) => [
          node.nodeId,
          node,
        ],
      ),
    );

  const remaining =
    new Map(
      byNodeId,
    );

  const emitted =
    new Set<string>();

  const ordered:
    ConversationNode[] =
      [];

  while (
    remaining.size >
    0
  ) {
    const ready =
      [
        ...remaining.values(),
      ]
        .filter(
          (
            node,
          ) =>
            node.parentId ===
              null ||
            !byNodeId.has(
              node.parentId,
            ) ||
            emitted.has(
              node.parentId,
            ),
        )
        .sort(
          (
            left,
            right,
          ) => {
            const leftTimestamp =
              left.timestamp ??
              Number.MAX_SAFE_INTEGER;

            const rightTimestamp =
              right.timestamp ??
              Number.MAX_SAFE_INTEGER;

            const timestampOrder =
              leftTimestamp -
              rightTimestamp;

            if (
              timestampOrder !==
              0
            ) {
              return timestampOrder;
            }

            return left.nodeId
              .localeCompare(
                right.nodeId,
              );
          },
        );

    if (
      ready.length ===
      0
    ) {
      throw new Error(
        "genesis_chatgpt_export_message_graph_cycle",
      );
    }

    for (
      const node
      of ready
    ) {
      ordered.push(
        node,
      );

      emitted.add(
        node.nodeId,
      );

      remaining.delete(
        node.nodeId,
      );
    }
  }

  return ordered;
}


function exportFiles(
  exportRoot:
    string,
): ExportFile[] {
  const root =
    realpathSync(
      exportRoot,
    );

  const info =
    statSync(
      root,
    );

  if (
    !info.isDirectory()
  ) {
    throw new Error(
      "genesis_chatgpt_export_root_must_be_directory",
    );
  }

  const filenames =
    readdirSync(
      root,
      {
        withFileTypes:
          true,
      },
    )
      .filter(
        (
          entry,
        ) =>
          entry.isFile() &&
          /^conversations.*\.json$/i.test(
            entry.name,
          ),
      )
      .map(
        (
          entry,
        ) =>
          entry.name,
      )
      .sort();

  if (
    filenames.length ===
    0
  ) {
    throw new Error(
      "genesis_chatgpt_export_conversation_files_missing",
    );
  }

  return filenames.map(
    (
      filename,
    ) => {
      const absolutePath =
        path.join(
          root,
          filename,
        );

      const content =
        readFileSync(
          absolutePath,
          "utf8",
        );

      return {
        absolutePath,

        relativePath:
          filename,

        content,

        checksum:
          sha256(
            content,
          ),
      };
    },
  );
}


function conversationRecords(
  file:
    ExportFile,
): JsonRecord[] {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        file.content,
      );
  } catch (
    error
  ) {
    throw new Error(
      `genesis_chatgpt_export_json_invalid:${file.relativePath}:${
        error instanceof Error
          ? error.message
          : String(
              error,
            )
      }`,
    );
  }

  if (
    !Array.isArray(
      parsed,
    )
  ) {
    throw new Error(
      `genesis_chatgpt_export_array_required:${file.relativePath}`,
    );
  }

  return parsed.map(
    (
      conversation,
      index,
    ) => {
      if (
        !isRecord(
          conversation,
        )
      ) {
        throw new Error(
          `genesis_chatgpt_export_conversation_invalid:${file.relativePath}:${index}`,
        );
      }

      return conversation;
    },
  );
}


function toHistoricalConversation(
  input: {
    conversation:
      JsonRecord;

    file:
      ExportFile;

    acquiredAt:
      number;

    projectResolver?:
      (
        conversation:
          Readonly<JsonRecord>,
      ) =>
        string |
        undefined;
  },
): GenesisHistoricalConversationInput {
  const conversationId =
    conversationIdentity(
      input.conversation,
    );

  const nodes =
    orderedNodes(
      messageNodes(
        input.conversation,
      ),
    );

  const projectId =
    input.projectResolver?.(
      input.conversation,
    );

  const createdAt =
    normalizeTimestamp(
      input.conversation
        .create_time,
    );

  const updatedAt =
    normalizeTimestamp(
      input.conversation
        .update_time,
    );

  const sourceRevision =
    stableHash({
      fileChecksum:
        input.file.checksum,

      conversation:
        input.conversation,
    });

  return {
    conversationId,

    projectId,

    title:
      conversationTitle(
        input.conversation,
        conversationId,
      ),

    createdAt,

    updatedAt,

    sourceRevision,

    acquisition: {
      provider:
        "chatgpt-data-export",

      acquisitionMethod:
        "chatgpt-export-json-v1",

      acquiredAt:
        input.acquiredAt,

      sourceLocator:
        `chatgpt-export://${input.file.relativePath}#conversation=${encodeURIComponent(
          conversationId,
        )}`,

      exportId:
        input.file.checksum,

      exportRevision:
        input.file.checksum,
    },

    privacy: {
      /*
       * Conversation exports are treated as sensitive by default.
       * A later governed privacy classifier may narrow this state;
       * acquisition must never assume exported history is public.
       */
      sensitivity:
        "sensitive",

      containsPersonalData:
        true,

      handlingNotes: [
        "Imported from user-controlled ChatGPT data export.",
        "Raw export metadata retained for provenance.",
      ],
    },

    messages:
      nodes.map(
        (
          node,
          order,
        ) => ({
          messageId:
            node.messageId,

          role:
            node.role,

          order,

          timestamp:
            node.timestamp,

          availability:
            "available",

          content:
            node.content,

          sourceLocator:
            `chatgpt-export://${input.file.relativePath}` +
            `#conversation=${encodeURIComponent(
              conversationId,
            )}` +
            `&message=${encodeURIComponent(
              node.messageId,
            )}`,

          metadata: {
            exportFile:
              input.file.relativePath,

            exportFileChecksum:
              input.file.checksum,

            conversationId,

            nodeId:
              node.nodeId,

            parentNodeId:
              node.parentId,

            rawRole:
              node.rawRole,

            rawTimestamp:
              node.rawTimestamp,

            rawMessage:
              node.rawMessage,

            rawNode:
              node.rawNode,
          },
        }),
      ),
  };
}


export class ChatGPTConversationExportSource
  implements GenesisHistoricalConversationSource
{
  readonly id:
    string;

  private readonly exportRoot:
    string;

  private readonly acquiredAt:
    () => number;

  private readonly projectResolver:
    ChatGPTConversationExportSourceOptions[
      "projectResolver"
    ];


  constructor(
    options:
      ChatGPTConversationExportSourceOptions,
  ) {
    this.exportRoot =
      options.exportRoot;

    this.id =
      options.sourceId ??
      "chatgpt-data-export";

    this.acquiredAt =
      options.acquiredAt ??
      (() =>
        Date.now());

    this.projectResolver =
      options.projectResolver;
  }


  async acquire():
    Promise<
      GenesisConversationAcquisitionSnapshot
    > {
    const acquiredAt =
      this.acquiredAt();

    const files =
      exportFiles(
        this.exportRoot,
      );

    const conversations:
      GenesisHistoricalConversationInput[] =
        [];

    const seenConversationIds =
      new Map<
        string,
        string
      >();

    for (
      const file
      of files
    ) {
      const records =
        conversationRecords(
          file,
        );

      for (
        const conversation
        of records
      ) {
        const normalized =
          toHistoricalConversation({
            conversation,

            file,

            acquiredAt,

            projectResolver:
              this.projectResolver,
          });

        const existingRevision =
          seenConversationIds.get(
            normalized.conversationId,
          );

        if (
          existingRevision
        ) {
          if (
            existingRevision !==
            normalized.sourceRevision
          ) {
            throw new Error(
              `genesis_chatgpt_export_duplicate_conversation_conflict:${normalized.conversationId}`,
            );
          }

          continue;
        }

        seenConversationIds.set(
          normalized.conversationId,
          normalized.sourceRevision ??
          "",
        );

        conversations.push(
          normalized,
        );
      }
    }

    conversations.sort(
      (
        left,
        right,
      ) =>
        left.conversationId
          .localeCompare(
            right.conversationId,
          ),
    );

    const acquisitionId =
      (
        "chatgpt-export-acquisition:" +
        stableHash({
          files:
            files.map(
              (
                file,
              ) => ({
                relativePath:
                  file.relativePath,

                checksum:
                  file.checksum,
              }),
            ),

          conversations:
            conversations.map(
              (
                conversation,
              ) => ({
                conversationId:
                  conversation.conversationId,

                sourceRevision:
                  conversation.sourceRevision,
              }),
            ),
        })
          .replace(
            /^sha256:/,
            "",
          )
      );

    return {
      acquisitionId,

      acquiredAt,

      conversations,

      /*
       * Absence from a particular export cannot by itself prove that
       * a historical conversation never existed or was deleted.
       * Day-0 completeness gaps are certified later against a governed
       * source inventory, not fabricated by this importer.
       */
      gaps:
        [],
    };
  }
}
