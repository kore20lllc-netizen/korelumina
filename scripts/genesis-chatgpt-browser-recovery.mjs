#!/usr/bin/env node

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

import {
  spawnSync,
} from "node:child_process";

import path from "node:path";
import process from "node:process";


const REPOSITORY_ROOT =
  process.cwd();

const PROFILE_ROOT =
  path.join(
    process.env.HOME,
    ".korelumina",
    "genesis",
    "chatgpt-browser-profile",
  );

const RECOVERY_ROOT =
  path.join(
    REPOSITORY_ROOT,
    "runtime-data",
    "genesis",
    "chatgpt-browser-recovery",
    "snapshots",
  );

const SESSION =
  "korelumina-genesis-chatgpt";

const SNAPSHOT_VERSION =
  "chatgpt-browser-recovery:v1";


function fail(
  message,
) {
  console.error(
    `ERROR: ${message}`,
  );

  process.exit(
    1,
  );
}


function runAgentBrowser(
  args,
  {
    input,
    allowFailure = false,
  } = {},
) {
  const result =
    spawnSync(
      "npx",
      [
        "-y",
        "agent-browser",
        "--session",
        SESSION,
        "--profile",
        PROFILE_ROOT,
        ...args,
      ],
      {
        cwd:
          REPOSITORY_ROOT,

        encoding:
          "utf8",

        input,

        stdio:
          [
            input === undefined
              ? "inherit"
              : "pipe",
            "pipe",
            "pipe",
          ],
      },
    );

  if (
    result.error
  ) {
    fail(
      `agent-browser could not start: ${result.error.message}`,
    );
  }

  if (
    result.status !==
      0 &&
    !allowFailure
  ) {
    const detail =
      [
        result.stdout,
        result.stderr,
      ]
        .filter(
          Boolean,
        )
        .join(
          "\n",
        )
        .trim();

    fail(
      detail ||
      `agent-browser exited with status ${result.status}`,
    );
  }

  return {
    status:
      result.status ?? 1,

    stdout:
      result.stdout ??
      "",

    stderr:
      result.stderr ??
      "",
  };
}


function jsonResult(
  result,
) {
  const raw =
    result.stdout.trim();

  if (
    raw.length ===
      0
  ) {
    fail(
      "agent-browser returned no JSON.",
    );
  }

  let envelope;

  try {
    envelope =
      JSON.parse(
        raw,
      );
  } catch {
    fail(
      `Unable to parse agent-browser JSON:\n${raw}`,
    );
  }

  if (
    envelope.success !==
      true
  ) {
    fail(
      envelope.error ??
      "agent-browser command failed.",
    );
  }

  return envelope.data;
}


function safeFilename(
  conversationId,
) {
  return (
    "conversation-" +
    conversationId.replace(
      /[^A-Za-z0-9._-]/g,
      "_",
    ) +
    ".json"
  );
}


function validateSnapshot(
  snapshot,
) {
  if (
    !snapshot ||
    typeof snapshot !==
      "object" ||
    Array.isArray(
      snapshot,
    )
  ) {
    fail(
      "Collector returned an invalid snapshot.",
    );
  }

  if (
    snapshot.snapshotVersion !==
      SNAPSHOT_VERSION
  ) {
    fail(
      "Collector snapshot version is invalid.",
    );
  }

  if (
    typeof snapshot.conversationId !==
      "string" ||
    snapshot.conversationId.trim()
      .length ===
      0
  ) {
    fail(
      "Conversation identity could not be recovered.",
    );
  }

  if (
    typeof snapshot.conversationUrl !==
      "string"
  ) {
    fail(
      "Conversation URL is missing.",
    );
  }

  const url =
    new URL(
      snapshot.conversationUrl,
    );

  const urlSegments =
    url.pathname
      .split("/")
      .filter(Boolean);

  const conversationMarkerIndex =
    urlSegments.lastIndexOf(
      "c",
    );

  const urlConversationId =
    conversationMarkerIndex >= 0
      ? urlSegments[
          conversationMarkerIndex + 1
        ]
      : null;

  if (
    url.protocol !==
      "https:" ||
    url.hostname !==
      "chatgpt.com" ||
    !urlConversationId ||
    decodeURIComponent(
      urlConversationId,
    ) !==
      snapshot.conversationId
  ) {
    fail(
      `Collector is not on a ChatGPT conversation URL: ${snapshot.conversationUrl}`,
    );
  }

  if (
    snapshot.projectId !==
      undefined &&
    (
      typeof snapshot.projectId !==
        "string" ||
      snapshot.projectId.trim()
        .length ===
        0
    )
  ) {
    fail(
      "Recovered project identity is invalid.",
    );
  }

  if (
    !Array.isArray(
      snapshot.messages,
    ) ||
    snapshot.messages.length ===
      0
  ) {
    fail(
      "No conversation messages were recovered. Do not persist an empty snapshot.",
    );
  }

  const ids =
    new Set();

  const orders =
    new Set();

  for (
    const message
    of snapshot.messages
  ) {
    if (
      !message ||
      typeof message !==
        "object"
    ) {
      fail(
        "Recovered message is invalid.",
      );
    }

    if (
      typeof message.messageId !==
        "string" ||
      message.messageId.length ===
        0
    ) {
      fail(
        "Recovered message identity is missing.",
      );
    }

    if (
      ids.has(
        message.messageId,
      )
    ) {
      fail(
        `Duplicate recovered message identity: ${message.messageId}`,
      );
    }

    ids.add(
      message.messageId,
    );

    if (
      !Number.isSafeInteger(
        message.order,
      ) ||
      message.order <
        0
    ) {
      fail(
        "Recovered message order is invalid.",
      );
    }

    if (
      orders.has(
        message.order,
      )
    ) {
      fail(
        `Duplicate recovered message order: ${message.order}`,
      );
    }

    orders.add(
      message.order,
    );

    if (
      typeof message.content !==
        "string"
    ) {
      fail(
        `Recovered message content is invalid: ${message.messageId}`,
      );
    }
  }

  return snapshot;
}


const EXTRACTION_SCRIPT = String.raw`
(() => {
  const SNAPSHOT_VERSION =
    "chatgpt-browser-recovery:v1";

  const href =
    window.location.href;

  const pathSegments =
    window.location.pathname
      .split("/")
      .filter(Boolean);

  const conversationMarkerIndex =
    pathSegments.lastIndexOf(
      "c"
    );

  const rawConversationId =
    conversationMarkerIndex >= 0
      ? pathSegments[
          conversationMarkerIndex + 1
        ]
      : undefined;

  if (!rawConversationId) {
    throw new Error(
      "chatgpt_browser_recovery_not_on_conversation"
    );
  }

  const conversationId =
    decodeURIComponent(
      rawConversationId
    );

  const normalizeRole = value => {
    switch (
      String(value ?? "")
        .trim()
        .toLowerCase()
    ) {
      case "user":
      case "assistant":
      case "system":
      case "developer":
      case "tool":
        return String(value)
          .trim()
          .toLowerCase();

      default:
        return "unknown";
    }
  };

  const textFor = element => {
    if (!element) {
      return "";
    }

    const clone =
      element.cloneNode(true);

    for (
      const removable
      of clone.querySelectorAll(
        [
          "button",
          "textarea",
          "input",
          "script",
          "style",
          "[aria-hidden='true']",
          "[data-testid*='copy']",
          "[data-testid*='feedback']",
        ].join(",")
      )
    ) {
      removable.remove();
    }

    return (
      clone.innerText ??
      clone.textContent ??
      ""
    )
      .replace(/\u00a0/g, " ")
      .trim();
  };

  const turns =
    Array.from(
      document.querySelectorAll(
        '[data-testid^="conversation-turn-"]'
      )
    );

  let rawMessages = [];

  if (turns.length > 0) {
    rawMessages =
      turns
        .map(
          (turn, index) => {
            const authored =
              turn.querySelector(
                "[data-message-author-role]"
              );

            if (!authored) {
              return null;
            }

            const role =
              normalizeRole(
                authored.getAttribute(
                  "data-message-author-role"
                )
              );

            const declaredId =
              authored.getAttribute(
                "data-message-id"
              ) ??
              turn.getAttribute(
                "data-message-id"
              );

            const turnId =
              turn.getAttribute(
                "data-testid"
              );

            const messageId =
              declaredId ||
              (
                turnId
                  ? conversationId + ":" + turnId
                  : conversationId + ":browser-turn-" + index
              );

            return {
              messageId,
              role,
              order:
                index,
              content:
                textFor(
                  authored
                ),
              sourceLocator:
                href + "#browser-turn=" + index,
            };
          }
        )
        .filter(Boolean);
  }

  if (
    rawMessages.length ===
      0
  ) {
    const authored =
      Array.from(
        document.querySelectorAll(
          "[data-message-author-role]"
        )
      );

    rawMessages =
      authored.map(
        (element, index) => ({
          messageId:
            element.getAttribute(
              "data-message-id"
            ) ||
            conversationId + ":browser-message-" + index,

          role:
            normalizeRole(
              element.getAttribute(
                "data-message-author-role"
              )
            ),

          order:
            index,

          content:
            textFor(
              element
            ),

          sourceLocator:
            href + "#browser-message=" + index,
        })
      );
  }

  const titleCandidates = [
    document.title
      ?.replace(
        /\s*[|\-]\s*ChatGPT\s*$/i,
        ""
      ),
    document.querySelector(
      '[data-testid="conversation-title"]'
    )?.textContent,
  ];

  const title =
    titleCandidates
      .map(
        value =>
          String(value ?? "")
            .trim()
      )
      .find(
        Boolean
      ) ||
    "ChatGPT conversation " + conversationId;

  const projectMarkerIndex =
    pathSegments.indexOf(
      "g"
    );

  const projectId =
    projectMarkerIndex >= 0 &&
    projectMarkerIndex <
      conversationMarkerIndex
      ? pathSegments[
          projectMarkerIndex + 1
        ]
      : undefined;

  return {
    snapshotVersion:
      SNAPSHOT_VERSION,

    conversationId,

    title,

    conversationUrl:
      window.location.origin +
      window.location.pathname,

    projectId,

    capturedAt:
      Date.now(),

    messages:
      rawMessages,
  };
})()
`;


function runSafariJavaScript(
  javascriptSource,
) {
  const appleScript = `
on run argv
  set javascriptSource to item 1 of argv

  tell application "Safari"
    if (count of windows) = 0 then
      error "Safari has no open window."
    end if

    return do JavaScript javascriptSource in current tab of front window
  end tell
end run
`;

  const result =
    spawnSync(
      "osascript",
      [
        "-",
        javascriptSource,
      ],
      {
        encoding:
          "utf8",

        input:
          appleScript,

        stdio: [
          "pipe",
          "pipe",
          "pipe",
        ],
      },
    );

  if (
    result.error
  ) {
    fail(
      `Safari Apple Events execution failed: ${result.error.message}`,
    );
  }

  if (
    result.status !==
      0
  ) {
    fail(
      (
        result.stderr ||
        result.stdout ||
        "Safari JavaScript execution failed."
      ).trim(),
    );
  }

  return result.stdout.trim();
}


function login() {
  console.log(
    "Opening ChatGPT in the existing Safari profile.",
  );

  console.log(
    "KoreLumina will use Safari's currently authenticated session.",
  );

  const result =
    spawnSync(
      "open",
      [
        "-a",
        "Safari",
        "https://chatgpt.com/",
      ],
      {
        encoding:
          "utf8",
      },
    );

  if (
    result.error ||
    result.status !==
      0
  ) {
    fail(
      result.error?.message ??
      result.stderr ??
      "Unable to open Safari.",
    );
  }
}


function inspect() {
  const raw =
    runSafariJavaScript(
      `JSON.stringify({
        url: location.href,
        title: document.title,
        turns: document.querySelectorAll(
          '[data-testid^="conversation-turn-"]'
        ).length,
        messages: document.querySelectorAll(
          '[data-message-author-role]'
        ).length
      })`,
    );

  let data;

  try {
    data =
      JSON.parse(
        raw,
      );
  } catch {
    fail(
      `Safari returned invalid inspection JSON:\n${raw}`,
    );
  }

  console.log(
    JSON.stringify(
      data,
      null,
      2,
    ),
  );
}


function discoverProjects() {
  const raw =
    runSafariJavaScript(
      `JSON.stringify((() => {
        const normalizeProjectId = value => {
          const match =
            String(value ?? "")
              .match(
                /^(g-p-[0-9a-f]{32})/i
              );

          return match
            ? match[1]
            : null;
        };

        const links =
          Array.from(
            document.querySelectorAll(
              "a[href]"
            )
          );

        const projectsById =
          new Map();

        for (
          const anchor
          of links
        ) {
          let url;

          try {
            url =
              new URL(
                anchor.href,
              );
          } catch {
            continue;
          }

          if (
            url.hostname !==
              "chatgpt.com"
          ) {
            continue;
          }

          const segments =
            url.pathname
              .split("/")
              .filter(Boolean);

          const gIndex =
            segments.indexOf(
              "g"
            );

          if (
            gIndex < 0 ||
            !segments[
              gIndex + 1
            ]
          ) {
            continue;
          }

          const rawProjectSegment =
            decodeURIComponent(
              segments[
                gIndex + 1
              ]
            );

          const projectId =
            normalizeProjectId(
              rawProjectSegment,
            );

          /*
           * Only g-p-* represents ChatGPT Projects.
           * Custom GPT identifiers such as g-... are not projects.
           */
          if (
            !projectId
          ) {
            continue;
          }

          const cIndex =
            segments.lastIndexOf(
              "c"
            );

          const conversationId =
            cIndex >= 0 &&
            segments[
              cIndex + 1
            ]
              ? decodeURIComponent(
                  segments[
                    cIndex + 1
                  ]
                )
              : null;

          const text =
            (
              anchor.innerText ||
              anchor.textContent ||
              ""
            ).trim();

          const existing =
            projectsById.get(
              projectId,
            ) ?? {
              projectId,

              titleCandidates:
                [],

              projectUrls:
                [],

              conversationIds:
                [],
            };

          if (
            conversationId
          ) {
            existing
              .conversationIds
              .push(
                conversationId,
              );
          } else {
            existing
              .projectUrls
              .push(
                url.origin +
                url.pathname,
              );

            if (
              text
            ) {
              existing
                .titleCandidates
                .push(
                  text,
                );
            }
          }

          projectsById.set(
            projectId,
            existing,
          );
        }

        const projects =
          Array.from(
            projectsById.values(),
          )
            .map(
              project => {
                const titleCandidates =
                  Array.from(
                    new Set(
                      project
                        .titleCandidates,
                    ),
                  )
                    .filter(Boolean);

                const projectUrls =
                  Array.from(
                    new Set(
                      project
                        .projectUrls,
                    ),
                  );

                const conversationIds =
                  Array.from(
                    new Set(
                      project
                        .conversationIds,
                    ),
                  )
                    .sort();

                return {
                  projectId:
                    project.projectId,

                  projectTitle:
                    titleCandidates[0] ??
                    project.projectId,

                  titleCandidates,

                  projectUrls,

                  visibleConversationCount:
                    conversationIds.length,

                  visibleConversationIds:
                    conversationIds,
                };
              },
            )
            .sort(
              (
                left,
                right,
              ) =>
                left.projectTitle.localeCompare(
                  right.projectTitle,
                ) ||
                left.projectId.localeCompare(
                  right.projectId,
                ),
            );

        return {
          registryDiscoveryVersion:
            "chatgpt-browser-project-registry-discovery:v1",

          discoveredAt:
            Date.now(),

          pageUrl:
            location.href,

          projectCount:
            projects.length,

          projects,
        };
      })())`,
    );

  let discovered;

  try {
    discovered =
      JSON.parse(
        raw,
      );
  } catch {
    fail(
      `Safari returned invalid project-registry JSON:\n${raw.slice(0, 1000)}`,
    );
  }

  if (
    !discovered ||
    !Array.isArray(
      discovered.projects,
    )
  ) {
    fail(
      "Project registry discovery returned invalid data.",
    );
  }

  const registryFile =
    path.join(
      REPOSITORY_ROOT,
      "runtime-data",
      "genesis",
      "chatgpt-browser-recovery",
      "project-registry.json",
    );

  mkdirSync(
    path.dirname(
      registryFile,
    ),
    {
      recursive:
        true,
    },
  );

  let previous = {
    registryVersion:
      "chatgpt-browser-project-registry:v1",

    projects:
      [],
  };

  try {
    previous =
      JSON.parse(
        readFileSync(
          registryFile,
          "utf8",
        ),
      );
  } catch {
    // First registry creation.
  }

  const previousById =
    new Map(
      (
        Array.isArray(
          previous.projects,
        )
          ? previous.projects
          : []
      ).map(
        project => [
          project.projectId,
          project,
        ],
      ),
    );

  const discoveredById =
    new Map(
      discovered.projects.map(
        project => [
          project.projectId,
          project,
        ],
      ),
    );

  const allProjectIds =
    [
      ...new Set([
        ...previousById.keys(),
        ...discoveredById.keys(),
      ]),
    ].sort();

  const projects =
    allProjectIds.map(
      projectId => {
        const existing =
          previousById.get(
            projectId,
          );

        const discoveredProject =
          discoveredById.get(
            projectId,
          );

        if (
          !discoveredProject &&
          existing
        ) {
          /*
           * A project may not be visible in the current Safari DOM.
           * Preserve its governed registry identity and disposition.
           */
          return {
            ...existing,

            visibleInLatestDiscovery:
              false,

            lastRegistryScanAt:
              discovered.discoveredAt,
          };
        }

        if (
          !discoveredProject
        ) {
          throw new Error(
            `chatgpt_browser_recovery_project_registry_merge_failed:${projectId}`,
          );
        }

        return {
          projectId:
            discoveredProject.projectId,

          projectTitle:
            discoveredProject.projectTitle,

          projectUrls:
            discoveredProject.projectUrls,

          visibleConversationCount:
            discoveredProject.visibleConversationCount,

          visibleConversationIds:
            discoveredProject.visibleConversationIds,

          disposition:
            existing?.disposition ??
            "REVIEW",

          dispositionReason:
            existing?.dispositionReason ??
            null,

          dispositionUpdatedAt:
            existing?.dispositionUpdatedAt,

          firstDiscoveredAt:
            existing?.firstDiscoveredAt ??
            discovered.discoveredAt,

          lastDiscoveredAt:
            discovered.discoveredAt,

          lastRegistryScanAt:
            discovered.discoveredAt,

          visibleInLatestDiscovery:
            true,
        };
      },
    );

  const registry = {
    registryVersion:
      "chatgpt-browser-project-registry:v1",

    updatedAt:
      Date.now(),

    sourcePageUrl:
      discovered.pageUrl,

    projects,
  };

  writeFileSync(
    registryFile,
    `${JSON.stringify(
      registry,
      null,
      2,
    )}\n`,
    {
      encoding:
        "utf8",

      mode:
        0o600,
    },
  );

  console.log(
    JSON.stringify(
      {
        ok:
          true,

        registryFile,

        projectCount:
          projects.length,

        projects:
          projects.map(
            project => ({
              projectId:
                project.projectId,

              projectTitle:
                project.projectTitle,

              disposition:
                project.disposition,

              visibleConversationCount:
                project.visibleConversationCount,

              projectUrls:
                project.projectUrls,
            }),
          ),
      },
      null,
      2,
    ),
  );
}


function loadProjectRegistry() {
  const registryFile =
    path.join(
      REPOSITORY_ROOT,
      "runtime-data",
      "genesis",
      "chatgpt-browser-recovery",
      "project-registry.json",
    );

  let registry;

  try {
    registry =
      JSON.parse(
        readFileSync(
          registryFile,
          "utf8",
        ),
      );
  } catch (
    error
  ) {
    throw new Error(
      `chatgpt_browser_recovery_project_registry_unreadable:${
        error instanceof Error
          ? error.message
          : String(
              error,
            )
      }`,
    );
  }

  if (
    !registry ||
    registry.registryVersion !==
      "chatgpt-browser-project-registry:v1" ||
    !Array.isArray(
      registry.projects,
    )
  ) {
    throw new Error(
      "chatgpt_browser_recovery_project_registry_invalid",
    );
  }

  return {
    registryFile,
    registry,
  };
}


function discoverProjectInventoryForCurrentPage() {
  const raw =
    runSafariJavaScript(
      `JSON.stringify((() => {
        const pathSegments =
          location.pathname
            .split("/")
            .filter(Boolean);

        const normalizeProjectId = value => {
          const match =
            String(value ?? "")
              .match(
                /^(g-p-[0-9a-f]{32})/i
              );

          return match
            ? match[1]
            : null;
        };

        const gIndex =
          pathSegments.indexOf(
            "g"
          );

        const rawProjectSegment =
          gIndex >= 0
            ? pathSegments[
                gIndex + 1
              ]
            : null;

        const projectId =
          normalizeProjectId(
            rawProjectSegment,
          );

        if (
          !projectId
        ) {
          throw new Error(
            "chatgpt_browser_recovery_not_in_project"
          );
        }

        const links =
          Array.from(
            document.querySelectorAll(
              "a[href]"
            )
          );

        const conversations =
          links
            .map(
              anchor => {
                let url;

                try {
                  url =
                    new URL(
                      anchor.href,
                    );
                } catch {
                  return null;
                }

                if (
                  url.hostname !==
                    "chatgpt.com"
                ) {
                  return null;
                }

                const segments =
                  url.pathname
                    .split("/")
                    .filter(Boolean);

                const linkGIndex =
                  segments.indexOf(
                    "g"
                  );

                const linkProjectId =
                  linkGIndex >= 0
                    ? normalizeProjectId(
                        segments[
                          linkGIndex + 1
                        ],
                      )
                    : null;

                if (
                  linkProjectId !==
                    projectId
                ) {
                  return null;
                }

                const cIndex =
                  segments.lastIndexOf(
                    "c"
                  );

                const rawConversationId =
                  cIndex >= 0
                    ? segments[
                        cIndex + 1
                      ]
                    : null;

                if (
                  !rawConversationId
                ) {
                  return null;
                }

                return {
                  conversationId:
                    decodeURIComponent(
                      rawConversationId,
                    ),

                  title:
                    (
                      anchor.innerText ||
                      anchor.textContent ||
                      ""
                    ).trim(),

                  conversationUrl:
                    url.origin +
                    url.pathname,
                };
              },
            )
            .filter(Boolean);

        const unique =
          Array.from(
            new Map(
              conversations.map(
                conversation => [
                  conversation.conversationId,
                  conversation,
                ],
              ),
            ).values(),
          )
            .sort(
              (
                left,
                right,
              ) =>
                left.title.localeCompare(
                  right.title,
                ) ||
                left.conversationId.localeCompare(
                  right.conversationId,
                ),
            );

        return {
          inventoryVersion:
            "chatgpt-browser-project-inventory:v1",

          projectId,

          projectTitle:
            document.title
              ?.replace(
                /\\s*[|\\-]\\s*ChatGPT\\s*$/i,
                ""
              )
              .split(" - ")[0]
              .trim() ||
            projectId,

          discoveredAt:
            Date.now(),

          pageUrl:
            location.href,

          currentConversationId:
            null,

          conversationCount:
            unique.length,

          conversations:
            unique,
        };
      })())`,
    );

  let inventory;

  try {
    inventory =
      JSON.parse(
        raw,
      );
  } catch {
    throw new Error(
      `chatgpt_browser_recovery_project_inventory_json_invalid:${raw.slice(0, 500)}`,
    );
  }

  if (
    !inventory ||
    typeof inventory.projectId !==
      "string" ||
    !Array.isArray(
      inventory.conversations,
    )
  ) {
    throw new Error(
      "chatgpt_browser_recovery_project_inventory_invalid",
    );
  }

  return inventory;
}


function persistProjectInventory(
  inventory,
) {
  const inventoryRoot =
    path.join(
      REPOSITORY_ROOT,
      "runtime-data",
      "genesis",
      "chatgpt-browser-recovery",
      "project-inventories",
    );

  mkdirSync(
    inventoryRoot,
    {
      recursive:
        true,
    },
  );

  const destination =
    path.join(
      inventoryRoot,
      `project-${inventory.projectId.replace(
        /[^A-Za-z0-9._-]/g,
        "_",
      )}.json`,
    );

  writeFileSync(
    destination,
    `${JSON.stringify(
      inventory,
      null,
      2,
    )}\n`,
    {
      encoding:
        "utf8",

      mode:
        0o600,
    },
  );

  return destination;
}


function waitForProject(
  projectId,
  timeoutMs = 30000,
) {
  const startedAt =
    Date.now();

  while (
    Date.now() -
      startedAt <
    timeoutMs
  ) {
    try {
      const raw =
        runSafariJavaScript(
          `JSON.stringify({
            path:
              location.pathname,
            title:
              document.title,
            links:
              document.querySelectorAll(
                "a[href]"
              ).length
          })`,
        );

      const state =
        JSON.parse(
          raw,
        );

      const segments =
        String(
          state.path ??
          "",
        )
          .split("/")
          .filter(Boolean);

      const gIndex =
        segments.indexOf(
          "g",
        );

      const rawProjectSegment =
        gIndex >= 0
          ? segments[
              gIndex + 1
            ]
          : "";

      const match =
        rawProjectSegment.match(
          /^(g-p-[0-9a-f]{32})/i,
        );

      const currentProjectId =
        match
          ? match[1]
          : null;

      if (
        currentProjectId ===
          projectId &&
        Number(
          state.links ??
          0,
        ) >
          0
      ) {
        return;
      }
    } catch {
      // Safari may briefly reject JS during route transition.
    }

    sleep(
      500,
    );
  }

  throw new Error(
    `chatgpt_browser_recovery_project_navigation_timeout:${projectId}`,
  );
}


function captureRecoverProjects() {
  let registryFile;
  let registry;

  try {
    ({
      registryFile,
      registry,
    } =
      loadProjectRegistry());
  } catch (
    error
  ) {
    fail(
      error instanceof Error
        ? error.message
        : String(
            error,
          ),
    );
  }

  const recoverProjects =
    registry.projects
      .filter(
        project =>
          project.disposition ===
          "RECOVER",
      )
      .sort(
        (
          left,
          right,
        ) =>
          left.projectTitle.localeCompare(
            right.projectTitle,
          ) ||
          left.projectId.localeCompare(
            right.projectId,
          ),
      );

  if (
    recoverProjects.length ===
      0
  ) {
    fail(
      "No projects are authorized with disposition RECOVER.",
    );
  }

  console.log(
    JSON.stringify(
      {
        registryFile,
        recoverProjectCount:
          recoverProjects.length,

        projects:
          recoverProjects.map(
            project => ({
              projectId:
                project.projectId,

              projectTitle:
                project.projectTitle,

              visibleConversationCount:
                project.visibleConversationCount,
            }),
          ),
      },
      null,
      2,
    ),
  );

  const orchestrationResults =
    [];

  for (
    const project
    of recoverProjects
  ) {
    console.log(
      `\n[project] ${project.projectTitle} (${project.projectId})`,
    );

    const projectUrl =
      Array.isArray(
        project.projectUrls,
      ) &&
      project.projectUrls.length >
        0
        ? project.projectUrls[0]
        : null;

    if (
      !projectUrl
    ) {
      orchestrationResults.push({
        projectId:
          project.projectId,

        projectTitle:
          project.projectTitle,

        state:
          "FAILED",

        error:
          "project_url_missing",
      });

      console.error(
        `[fail] ${project.projectTitle}: project URL missing`,
      );

      continue;
    }

    try {
      setSafariUrl(
        projectUrl,
      );

      waitForProject(
        project.projectId,
      );

      sleep(
        1000,
      );

      const expectedInventoryFile =
        path.join(
          REPOSITORY_ROOT,
          "runtime-data",
          "genesis",
          "chatgpt-browser-recovery",
          "project-inventories",
          `project-${project.projectId.replace(
            /[^A-Za-z0-9._-]/g,
            "_",
          )}.json`,
        );

      let inventoryFile =
        null;

      let inventory =
        null;

      /*
       * Prefer an already governed persisted project inventory.
       *
       * ChatGPT project landing pages do not always render their
       * conversation links immediately, so live discovery must not
       * invalidate a previously successful inventory.
       */
      try {
        const persistedInventory =
          loadProjectInventory(
            expectedInventoryFile,
          );

        if (
          persistedInventory.projectId ===
            project.projectId &&
          persistedInventory.conversationCount >
            0
        ) {
          inventory =
            persistedInventory;

          inventoryFile =
            expectedInventoryFile;

          console.log(
            `[inventory:cached] ${inventory.conversationCount} conversations — ${inventoryFile}`,
          );
        }
      } catch {
        // No usable persisted inventory yet.
      }

      /*
       * Attempt a live refresh. Only replace the governed inventory
       * when discovery returns a non-empty inventory for this exact
       * project.
       */
      try {
        const discovered =
          discoverProjectInventoryForCurrentPage();

        if (
          discovered.projectId ===
            project.projectId &&
          discovered.conversationCount >
            0
        ) {
          inventory =
            discovered;

          inventoryFile =
            persistProjectInventory(
              discovered,
            );

          console.log(
            `[inventory:refreshed] ${discovered.conversationCount} conversations — ${inventoryFile}`,
          );
        } else if (
          inventory
        ) {
          console.log(
            `[inventory:refresh-unavailable] retaining ${inventory.conversationCount} governed conversations`,
          );
        }
      } catch (
        discoveryError
      ) {
        if (
          inventory
        ) {
          console.log(
            `[inventory:refresh-unavailable] retaining governed inventory — ${
              discoveryError instanceof Error
                ? discoveryError.message
                : String(
                    discoveryError,
                  )
            }`,
          );
        } else {
          throw discoveryError;
        }
      }

      if (
        !inventory ||
        !inventoryFile
      ) {
        throw new Error(
          "chatgpt_browser_recovery_project_inventory_unavailable",
        );
      }

      captureProject(
        inventoryFile,
      );

      orchestrationResults.push({
        projectId:
          project.projectId,

        projectTitle:
          project.projectTitle,

        state:
          "CAPTURE_INVOKED",

        inventoryFile,

        conversationCount:
          inventory.conversationCount,
      });
    } catch (
      error
    ) {
      orchestrationResults.push({
        projectId:
          project.projectId,

        projectTitle:
          project.projectTitle,

        state:
          "FAILED",

        error:
          error instanceof Error
            ? error.message
            : String(
                error,
              ),
      });

      console.error(
        `[fail] ${project.projectTitle}: ${
          error instanceof Error
            ? error.message
            : String(
                error,
              )
        }`,
      );
    }
  }

  console.log(
    "\n" +
    JSON.stringify(
      {
        ok:
          orchestrationResults.every(
            result =>
              result.state !==
              "FAILED",
          ),

        results:
          orchestrationResults,
      },
      null,
      2,
    ),
  );

  if (
    orchestrationResults.some(
      result =>
        result.state ===
        "FAILED",
    )
  ) {
    process.exitCode =
      2;
  }
}


function setProjectDisposition(
  projectId,
  disposition,
  reason,
) {
  if (
    !projectId ||
    ![
      "REVIEW",
      "RECOVER",
      "IGNORE",
    ].includes(
      disposition,
    )
  ) {
    fail(
      "set-project requires: <projectId> <REVIEW|RECOVER|IGNORE> [reason]",
    );
  }

  const registryFile =
    path.join(
      REPOSITORY_ROOT,
      "runtime-data",
      "genesis",
      "chatgpt-browser-recovery",
      "project-registry.json",
    );

  let registry;

  try {
    registry =
      JSON.parse(
        readFileSync(
          registryFile,
          "utf8",
        ),
      );
  } catch {
    fail(
      "Project registry does not exist. Run discover-projects first.",
    );
  }

  const project =
    registry.projects
      ?.find(
        item =>
          item.projectId ===
          projectId,
      );

  if (
    !project
  ) {
    fail(
      `Unknown project: ${projectId}`,
    );
  }

  project.disposition =
    disposition;

  project.dispositionReason =
    reason?.trim() ||
    null;

  project.dispositionUpdatedAt =
    Date.now();

  writeFileSync(
    registryFile,
    `${JSON.stringify(
      registry,
      null,
      2,
    )}\n`,
    {
      encoding:
        "utf8",

      mode:
        0o600,
    },
  );

  console.log(
    JSON.stringify(
      {
        ok:
          true,

        projectId:
          project.projectId,

        projectTitle:
          project.projectTitle,

        disposition:
          project.disposition,

        dispositionReason:
          project.dispositionReason,
      },
      null,
      2,
    ),
  );
}


function discoverProject() {
  const raw =
    runSafariJavaScript(
      `JSON.stringify((() => {
        const pathSegments =
          location.pathname
            .split("/")
            .filter(Boolean);

        const projectMarkerIndex =
          pathSegments.indexOf(
            "g"
          );

        const projectId =
          projectMarkerIndex >= 0
            ? pathSegments[
                projectMarkerIndex + 1
              ]
            : null;

        if (!projectId) {
          throw new Error(
            "chatgpt_browser_recovery_not_in_project"
          );
        }

        const projectConversationPrefix =
          "/g/" +
          projectId +
          "/c/";

        const links =
          Array.from(
            document.querySelectorAll(
              "a[href]"
            )
          );

        const conversations =
          links
            .map(
              anchor => {
                let url;

                try {
                  url =
                    new URL(
                      anchor.href,
                    );
                } catch {
                  return null;
                }

                if (
                  url.hostname !==
                    "chatgpt.com" ||
                  !url.pathname.startsWith(
                    projectConversationPrefix
                  )
                ) {
                  return null;
                }

                const segments =
                  url.pathname
                    .split("/")
                    .filter(Boolean);

                const conversationMarkerIndex =
                  segments.lastIndexOf(
                    "c"
                  );

                const rawConversationId =
                  conversationMarkerIndex >= 0
                    ? segments[
                        conversationMarkerIndex + 1
                      ]
                    : null;

                if (!rawConversationId) {
                  return null;
                }

                return {
                  conversationId:
                    decodeURIComponent(
                      rawConversationId
                    ),

                  title:
                    (
                      anchor.innerText ||
                      anchor.textContent ||
                      ""
                    ).trim(),

                  conversationUrl:
                    url.origin +
                    url.pathname,
                };
              }
            )
            .filter(Boolean);

        const unique =
          Array.from(
            new Map(
              conversations.map(
                conversation => [
                  conversation.conversationId,
                  conversation,
                ]
              )
            ).values()
          )
            .sort(
              (left, right) =>
                left.title.localeCompare(
                  right.title
                ) ||
                left.conversationId.localeCompare(
                  right.conversationId
                )
            );

        const currentConversationIndex =
          pathSegments.lastIndexOf(
            "c"
          );

        const currentConversationId =
          currentConversationIndex >= 0
            ? pathSegments[
                currentConversationIndex + 1
              ]
            : null;

        return {
          inventoryVersion:
            "chatgpt-browser-project-inventory:v1",

          projectId,

          projectTitle:
            document.title
              ?.replace(
                /\\s*[|\\-]\\s*ChatGPT\\s*$/i,
                ""
              )
              .split(" - ")[0]
              .trim() ||
            projectId,

          discoveredAt:
            Date.now(),

          pageUrl:
            location.href,

          currentConversationId,

          conversationCount:
            unique.length,

          conversations:
            unique,
        };
      })())`,
    );

  let inventory;

  try {
    inventory =
      JSON.parse(
        raw,
      );
  } catch {
    fail(
      `Safari returned invalid project inventory JSON:\n${raw.slice(0, 1000)}`,
    );
  }

  if (
    !inventory ||
    typeof inventory !==
      "object" ||
    typeof inventory.projectId !==
      "string" ||
    !Array.isArray(
      inventory.conversations,
    )
  ) {
    fail(
      "Project discovery returned an invalid inventory.",
    );
  }

  const inventoryRoot =
    path.join(
      REPOSITORY_ROOT,
      "runtime-data",
      "genesis",
      "chatgpt-browser-recovery",
      "project-inventories",
    );

  mkdirSync(
    inventoryRoot,
    {
      recursive:
        true,
    },
  );

  const destination =
    path.join(
      inventoryRoot,
      `project-${inventory.projectId.replace(
        /[^A-Za-z0-9._-]/g,
        "_",
      )}.json`,
    );

  writeFileSync(
    destination,
    `${JSON.stringify(
      inventory,
      null,
      2,
    )}\n`,
    {
      encoding:
        "utf8",

      mode:
        0o600,
    },
  );

  console.log(
    JSON.stringify(
      {
        ok:
          true,

        browser:
          "Safari",

        destination,

        projectId:
          inventory.projectId,

        projectTitle:
          inventory.projectTitle,

        conversationCount:
          inventory.conversationCount,

        conversations:
          inventory.conversations,
      },
      null,
      2,
    ),
  );
}


function captureCurrentSnapshot(
  {
    attempts = 20,
    retryDelayMs = 500,
  } = {},
) {
  let lastError =
    "No capture attempt completed.";

  for (
    let attempt =
      1;
    attempt <=
      attempts;
    attempt +=
      1
  ) {
    try {
      const raw =
        runSafariJavaScript(
          "JSON.stringify(" +
          EXTRACTION_SCRIPT +
          ")",
        );

      let captured;

      try {
        captured =
          JSON.parse(
            raw,
          );
      } catch {
        throw new Error(
          `Safari returned invalid capture JSON: ${raw.slice(0, 500)}`,
        );
      }

      if (
        !captured ||
        !Array.isArray(
          captured.messages,
        ) ||
        captured.messages.length ===
          0
      ) {
        throw new Error(
          "conversation_messages_not_stably_rendered",
        );
      }

      return validateSnapshot(
        captured,
      );
    } catch (
      error
    ) {
      lastError =
        error instanceof Error
          ? error.message
          : String(
              error,
            );

      if (
        attempt <
        attempts
      ) {
        sleep(
          retryDelayMs,
        );
      }
    }
  }

  fail(
    `Conversation capture did not stabilize after ${attempts} attempts: ${lastError}`,
  );
}


function persistSnapshot(
  snapshot,
) {
  mkdirSync(
    RECOVERY_ROOT,
    {
      recursive:
        true,
    },
  );

  const destination =
    path.join(
      RECOVERY_ROOT,
      safeFilename(
        snapshot.conversationId,
      ),
    );

  writeFileSync(
    destination,
    `${JSON.stringify(
      snapshot,
      null,
      2,
    )}\n`,
    {
      encoding:
        "utf8",

      mode:
        0o600,
    },
  );

  return destination;
}


function captureCurrent() {
  const snapshot =
    captureCurrentSnapshot();

  const destination =
    persistSnapshot(
      snapshot,
    );

  console.log(
    JSON.stringify(
      {
        ok:
          true,

        browser:
          "Safari",

        destination,

        conversationId:
          snapshot.conversationId,

        title:
          snapshot.title,

        messageCount:
          snapshot.messages.length,

        roles:
          snapshot.messages.reduce(
            (
              counts,
              message,
            ) => {
              counts[
                message.role
              ] =
                (
                  counts[
                    message.role
                  ] ??
                  0
                ) +
                1;

              return counts;
            },
            {},
          ),
      },
      null,
      2,
    ),
  );
}


function sleep(
  milliseconds,
) {
  const buffer =
    new SharedArrayBuffer(
      4,
    );

  const view =
    new Int32Array(
      buffer,
    );

  Atomics.wait(
    view,
    0,
    0,
    milliseconds,
  );
}


function setSafariUrl(
  url,
) {
  const appleScript = `
on run argv
  set targetUrl to item 1 of argv

  tell application "Safari"
    if (count of windows) = 0 then
      error "Safari has no open window."
    end if

    set URL of current tab of front window to targetUrl
  end tell
end run
`;

  const result =
    spawnSync(
      "osascript",
      [
        "-",
        url,
      ],
      {
        encoding:
          "utf8",

        input:
          appleScript,

        stdio: [
          "pipe",
          "pipe",
          "pipe",
        ],
      },
    );

  if (
    result.error ||
    result.status !==
      0
  ) {
    throw new Error(
      (
        result.stderr ||
        result.stdout ||
        result.error?.message ||
        "Safari navigation failed."
      ).trim(),
    );
  }
}


function waitForConversation(
  conversationId,
  timeoutMs = 45000,
) {
  const startedAt =
    Date.now();

  let stableObservations =
    0;

  let previousCount =
    null;

  while (
    Date.now() -
      startedAt <
    timeoutMs
  ) {
    try {
      const raw =
        runSafariJavaScript(
          `JSON.stringify({
            path:
              location.pathname,

            readyState:
              document.readyState,

            messages:
              document.querySelectorAll(
                '[data-message-author-role]'
              ).length,

            turns:
              document.querySelectorAll(
                '[data-testid^="conversation-turn-"]'
              ).length
          })`,
        );

      const state =
        JSON.parse(
          raw,
        );

      const segments =
        String(
          state.path ??
          "",
        )
          .split("/")
          .filter(Boolean);

      const marker =
        segments.lastIndexOf(
          "c",
        );

      const currentId =
        marker >= 0
          ? decodeURIComponent(
              segments[
                marker + 1
              ] ??
              "",
            )
          : null;

      const renderedCount =
        Math.max(
          Number(
            state.messages ??
            0,
          ),
          Number(
            state.turns ??
            0,
          ),
        );

      if (
        currentId ===
          conversationId &&
        renderedCount >
          0
      ) {
        if (
          previousCount ===
          renderedCount
        ) {
          stableObservations +=
            1;
        } else {
          stableObservations =
            1;

          previousCount =
            renderedCount;
        }

        /*
         * Require three consecutive equal observations.
         * This avoids capturing during ChatGPT's transient SPA render.
         */
        if (
          stableObservations >=
          3
        ) {
          return;
        }
      } else {
        stableObservations =
          0;

        previousCount =
          null;
      }
    } catch {
      stableObservations =
        0;

      previousCount =
        null;
    }

    sleep(
      750,
    );
  }

  throw new Error(
    `chatgpt_browser_recovery_navigation_timeout:${conversationId}`,
  );
}


function projectInventoryPath(
  explicitPath,
) {
  if (
    explicitPath
  ) {
    return path.resolve(
      explicitPath,
    );
  }

  const raw =
    runSafariJavaScript(
      `JSON.stringify({
        pathname:
          location.pathname
      })`,
    );

  const current =
    JSON.parse(
      raw,
    );

  const segments =
    String(
      current.pathname ??
      "",
    )
      .split("/")
      .filter(Boolean);

  const marker =
    segments.indexOf(
      "g",
    );

  const projectId =
    marker >= 0
      ? segments[
          marker + 1
        ]
      : null;

  if (
    !projectId
  ) {
    throw new Error(
      "chatgpt_browser_recovery_not_in_project",
    );
  }

  return path.join(
    REPOSITORY_ROOT,
    "runtime-data",
    "genesis",
    "chatgpt-browser-recovery",
    "project-inventories",
    `project-${projectId.replace(
      /[^A-Za-z0-9._-]/g,
      "_",
    )}.json`,
  );
}


function loadProjectInventory(
  filename,
) {
  let inventory;

  try {
    inventory =
      JSON.parse(
        readFileSync(
          filename,
          "utf8",
        ),
      );
  } catch (
    error
  ) {
    throw new Error(
      `chatgpt_browser_recovery_inventory_unreadable:${filename}:${
        error instanceof Error
          ? error.message
          : String(
              error,
            )
      }`,
    );
  }

  if (
    !inventory ||
    inventory.inventoryVersion !==
      "chatgpt-browser-project-inventory:v1" ||
    typeof inventory.projectId !==
      "string" ||
    !Array.isArray(
      inventory.conversations,
    )
  ) {
    throw new Error(
      "chatgpt_browser_recovery_inventory_invalid",
    );
  }

  return inventory;
}


function captureProject(
  explicitInventoryPath,
) {
  let inventoryFile;

  try {
    inventoryFile =
      projectInventoryPath(
        explicitInventoryPath,
      );
  } catch (
    error
  ) {
    fail(
      error instanceof Error
        ? error.message
        : String(
            error,
          ),
    );
  }

  let inventory;

  try {
    inventory =
      loadProjectInventory(
        inventoryFile,
      );
  } catch (
    error
  ) {
    fail(
      error instanceof Error
        ? error.message
        : String(
            error,
          ),
    );
  }

  mkdirSync(
    RECOVERY_ROOT,
    {
      recursive:
        true,
    },
  );

  const checkpointRoot =
    path.join(
      REPOSITORY_ROOT,
      "runtime-data",
      "genesis",
      "chatgpt-browser-recovery",
      "checkpoints",
    );

  mkdirSync(
    checkpointRoot,
    {
      recursive:
        true,
    },
  );

  const checkpointFile =
    path.join(
      checkpointRoot,
      `project-${inventory.projectId.replace(
        /[^A-Za-z0-9._-]/g,
        "_",
      )}.json`,
    );

  let checkpoint = {
    checkpointVersion:
      "chatgpt-browser-project-capture:v1",

    projectId:
      inventory.projectId,

    projectTitle:
      inventory.projectTitle,

    inventoryFile,

    startedAt:
      Date.now(),

    updatedAt:
      Date.now(),

    completedConversationIds:
      [],

    failures:
      [],
  };

  try {
    checkpoint = {
      ...checkpoint,
      ...JSON.parse(
        readFileSync(
          checkpointFile,
          "utf8",
        ),
      ),
    };
  } catch {
    // No prior checkpoint is expected on the first run.
  }

  const completed =
    new Set(
      checkpoint
        .completedConversationIds ??
      [],
    );

  const failures =
    Array.isArray(
      checkpoint.failures,
    )
      ? [
          ...checkpoint.failures,
        ]
      : [];

  const writeCheckpoint =
    () => {
      checkpoint = {
        ...checkpoint,

        updatedAt:
          Date.now(),

        completedConversationIds: [
          ...completed,
        ].sort(),

        failures,
      };

      writeFileSync(
        checkpointFile,
        `${JSON.stringify(
          checkpoint,
          null,
          2,
        )}\n`,
        {
          encoding:
            "utf8",

          mode:
            0o600,
        },
      );
    };

  console.log(
    JSON.stringify(
      {
        projectId:
          inventory.projectId,

        projectTitle:
          inventory.projectTitle,

        inventoryConversations:
          inventory.conversations.length,

        alreadyCompleted:
          completed.size,

        checkpointFile,
      },
      null,
      2,
    ),
  );

  for (
    const conversation
    of inventory.conversations
  ) {
    const conversationId =
      conversation.conversationId;

    if (
      completed.has(
        conversationId,
      )
    ) {
      console.log(
        `[skip] ${conversation.title} (${conversationId})`,
      );

      continue;
    }

    console.log(
      `[capture] ${conversation.title} (${conversationId})`,
    );

    try {
      setSafariUrl(
        conversation.conversationUrl,
      );

      waitForConversation(
        conversationId,
      );

      /*
       * Give the rendered conversation a brief stabilization window
       * after message nodes first become available.
       */
      sleep(
        1000,
      );

      const snapshot =
        captureCurrentSnapshot();

      if (
        snapshot.conversationId !==
          conversationId
      ) {
        throw new Error(
          `chatgpt_browser_recovery_wrong_conversation:${snapshot.conversationId}`,
        );
      }

      if (
        snapshot.projectId !==
          inventory.projectId
      ) {
        throw new Error(
          `chatgpt_browser_recovery_wrong_project:${snapshot.projectId ?? "none"}`,
        );
      }

      const destination =
        persistSnapshot(
          snapshot,
        );

      completed.add(
        conversationId,
      );

      for (
        let index =
          failures.length - 1;
        index >=
          0;
        index -=
          1
      ) {
        if (
          failures[
            index
          ]?.conversationId ===
            conversationId
        ) {
          failures.splice(
            index,
            1,
          );
        }
      }

      writeCheckpoint();

      console.log(
        `[ok] ${snapshot.title} — ${snapshot.messages.length} messages — ${destination}`,
      );
    } catch (
      error
    ) {
      failures.push({
        conversationId,

        title:
          conversation.title,

        conversationUrl:
          conversation.conversationUrl,

        failedAt:
          Date.now(),

        error:
          error instanceof Error
            ? error.message
            : String(
                error,
              ),
      });

      writeCheckpoint();

      console.error(
        `[fail] ${conversation.title}: ${
          error instanceof Error
            ? error.message
            : String(
                error,
              )
        }`,
      );
    }
  }

  writeCheckpoint();

  console.log(
    JSON.stringify(
      {
        ok:
          failures.length ===
            0,

        projectId:
          inventory.projectId,

        projectTitle:
          inventory.projectTitle,

        inventoryConversations:
          inventory.conversations.length,

        completed:
          completed.size,

        failures:
          failures.length,

        checkpointFile,
      },
      null,
      2,
    ),
  );

  if (
    failures.length >
      0
  ) {
    process.exitCode =
      2;
  }
}


function validateFile(
  filename,
) {
  const absolute =
    path.resolve(
      filename,
    );

  const snapshot =
    validateSnapshot(
      JSON.parse(
        readFileSync(
          absolute,
          "utf8",
        ),
      ),
    );

  console.log(
    JSON.stringify(
      {
        ok:
          true,
        file:
          absolute,
        conversationId:
          snapshot.conversationId,
        messageCount:
          snapshot.messages.length,
      },
      null,
      2,
    ),
  );
}


const [
  command,
  argument,
  argument2,
  ...remainingArguments
] =
  process.argv.slice(
    2,
  );


switch (
  command
) {
  case "login":
    login();
    break;

  case "inspect":
    inspect();
    break;

  case "discover-projects":
    discoverProjects();
    break;

  case "discover-project":
    discoverProject();
    break;

  case "set-project":
    setProjectDisposition(
      argument,
      argument2,
      remainingArguments.join(
        " ",
      ),
    );
    break;

  case "capture-current":
    captureCurrent();
    break;

  case "capture-project":
    captureProject(
      argument,
    );
    break;

  case "capture-recover-projects":
    captureRecoverProjects();
    break;

  case "validate":
    if (
      !argument
    ) {
      fail(
        "validate requires a snapshot path.",
      );
    }

    validateFile(
      argument,
    );
    break;

  default:
    console.log(`
KoreLumina Genesis ChatGPT Browser Recovery

Commands:
  node scripts/genesis-chatgpt-browser-recovery.mjs login
  node scripts/genesis-chatgpt-browser-recovery.mjs inspect
  node scripts/genesis-chatgpt-browser-recovery.mjs discover-projects
  node scripts/genesis-chatgpt-browser-recovery.mjs set-project <projectId> <REVIEW|RECOVER|IGNORE> [reason]
  node scripts/genesis-chatgpt-browser-recovery.mjs discover-project
  node scripts/genesis-chatgpt-browser-recovery.mjs capture-current
  node scripts/genesis-chatgpt-browser-recovery.mjs capture-project [project-inventory.json]
  node scripts/genesis-chatgpt-browser-recovery.mjs capture-recover-projects
  node scripts/genesis-chatgpt-browser-recovery.mjs validate <snapshot.json>

Profile:
  ${PROFILE_ROOT}

Snapshots:
  ${RECOVERY_ROOT}
`.trim());

    process.exit(
      command
        ? 1
        : 0,
    );
}
