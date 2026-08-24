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

  if (
    url.protocol !==
      "https:" ||
    url.hostname !==
      "chatgpt.com" ||
    !/^\/c\/[^/]+/.test(
      url.pathname,
    )
  ) {
    fail(
      `Collector is not on a ChatGPT conversation URL: ${snapshot.conversationUrl}`,
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

  return {
    snapshotVersion:
      SNAPSHOT_VERSION,

    conversationId,

    title,

    conversationUrl:
      window.location.origin + "/c/" + encodeURIComponent(
        conversationId
      ),

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


function captureCurrent() {
  mkdirSync(
    RECOVERY_ROOT,
    {
      recursive:
        true,
    },
  );

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
    fail(
      `Safari returned invalid capture JSON:\n${raw.slice(0, 1000)}`,
    );
  }

  const snapshot =
    validateSnapshot(
      captured,
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

  case "capture-current":
    captureCurrent();
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
  node scripts/genesis-chatgpt-browser-recovery.mjs capture-current
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
