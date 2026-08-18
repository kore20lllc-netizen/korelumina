import assert from "node:assert/strict";
import test from "node:test";

import {
  createExecutiveActionExecutorPolicy,
} from "../ExecutiveActionExecutorPolicy.js";

import {
  ExecutiveActionExecutorPolicyRegistry,
} from "../ExecutiveActionExecutorPolicyRegistry.js";

test(
  "registered executor may use only explicitly declared capability and scope",
  () => {
    const registry =
      new ExecutiveActionExecutorPolicyRegistry();

    registry.register(
      createExecutiveActionExecutorPolicy({
        executorName:
          "project-file-reader",

        capabilities: [
          "filesystem:read",
        ],

        scopes: [
          "project",
        ],

        requiresProjectId:
          true,
      }),
    );

    const allowed =
      registry.evaluate({
        executorName:
          "project-file-reader",

        capability:
          "filesystem:read",

        scope:
          "project",

        projectId:
          "project:korelumina",
      });

    assert.equal(
      allowed.allowed,
      true,
    );

    assert.equal(
      allowed.reason,
      "executive_executor_policy_allowed",
    );
  },
);

test(
  "undeclared capability is denied",
  () => {
    const registry =
      new ExecutiveActionExecutorPolicyRegistry();

    registry.register(
      createExecutiveActionExecutorPolicy({
        executorName:
          "reader",

        capabilities: [
          "filesystem:read",
        ],

        scopes: [
          "project",
        ],
      }),
    );

    const decision =
      registry.evaluate({
        executorName:
          "reader",

        capability:
          "filesystem:write",

        scope:
          "project",
      });

    assert.equal(
      decision.allowed,
      false,
    );

    assert.equal(
      decision.reason,
      "executive_executor_capability_not_declared",
    );
  },
);

test(
  "explicitly prohibited capability is denied",
  () => {
    const registry =
      new ExecutiveActionExecutorPolicyRegistry();

    registry.register(
      createExecutiveActionExecutorPolicy({
        executorName:
          "safe-runtime-reader",

        capabilities: [
          "runtime:start",
        ],

        scopes: [
          "project",
        ],

        prohibitedCapabilities: [
          "filesystem:delete",
        ],
      }),
    );

    const decision =
      registry.evaluate({
        executorName:
          "safe-runtime-reader",

        capability:
          "filesystem:delete",

        scope:
          "project",
      });

    assert.equal(
      decision.allowed,
      false,
    );

    assert.equal(
      decision.reason,
      "executive_executor_capability_prohibited",
    );
  },
);

test(
  "scope outside executor declaration is denied",
  () => {
    const registry =
      new ExecutiveActionExecutorPolicyRegistry();

    registry.register(
      createExecutiveActionExecutorPolicy({
        executorName:
          "project-only",

        capabilities: [
          "filesystem:read",
        ],

        scopes: [
          "project",
        ],
      }),
    );

    const decision =
      registry.evaluate({
        executorName:
          "project-only",

        capability:
          "filesystem:read",

        scope:
          "platform",
      });

    assert.equal(
      decision.allowed,
      false,
    );

    assert.equal(
      decision.reason,
      "executive_executor_scope_not_allowed",
    );
  },
);

test(
  "project-scoped executor can require concrete project id",
  () => {
    const registry =
      new ExecutiveActionExecutorPolicyRegistry();

    registry.register(
      createExecutiveActionExecutorPolicy({
        executorName:
          "project-reader",

        capabilities: [
          "filesystem:read",
        ],

        scopes: [
          "project",
        ],

        requiresProjectId:
          true,
      }),
    );

    const decision =
      registry.evaluate({
        executorName:
          "project-reader",

        capability:
          "filesystem:read",

        scope:
          "project",
      });

    assert.equal(
      decision.allowed,
      false,
    );

    assert.equal(
      decision.reason,
      "executive_executor_project_scope_required",
    );
  },
);

test(
  "workspace-scoped executor can require concrete workspace id",
  () => {
    const registry =
      new ExecutiveActionExecutorPolicyRegistry();

    registry.register(
      createExecutiveActionExecutorPolicy({
        executorName:
          "workspace-reader",

        capabilities: [
          "filesystem:read",
        ],

        scopes: [
          "workspace",
        ],

        requiresWorkspaceId:
          true,
      }),
    );

    const decision =
      registry.evaluate({
        executorName:
          "workspace-reader",

        capability:
          "filesystem:read",

        scope:
          "workspace",
      });

    assert.equal(
      decision.allowed,
      false,
    );

    assert.equal(
      decision.reason,
      "executive_executor_workspace_scope_required",
    );
  },
);

test(
  "unregistered executor is denied by default",
  () => {
    const registry =
      new ExecutiveActionExecutorPolicyRegistry();

    const decision =
      registry.evaluate({
        executorName:
          "unknown",

        capability:
          "filesystem:read",

        scope:
          "project",
      });

    assert.equal(
      decision.allowed,
      false,
    );

    assert.equal(
      decision.reason,
      "executive_executor_policy_not_registered",
    );
  },
);

test(
  "policy cannot declare the same capability as allowed and prohibited",
  () => {
    assert.throws(
      () =>
        createExecutiveActionExecutorPolicy({
          executorName:
            "invalid",

          capabilities: [
            "filesystem:write",
          ],

          scopes: [
            "project",
          ],

          prohibitedCapabilities: [
            "filesystem:write",
          ],
        }),
      /executive_executor_policy_capability_conflict/,
    );
  },
);

test(
  "duplicate executor policies are rejected",
  () => {
    const registry =
      new ExecutiveActionExecutorPolicyRegistry();

    const policy =
      createExecutiveActionExecutorPolicy({
        executorName:
          "reader",

        capabilities: [
          "filesystem:read",
        ],

        scopes: [
          "project",
        ],
      });

    registry.register(
      policy,
    );

    assert.throws(
      () =>
        registry.register(
          policy,
        ),
      /executive_executor_policy_already_registered/,
    );
  },
);
