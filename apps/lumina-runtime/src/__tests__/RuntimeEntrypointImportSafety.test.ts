import assert from "node:assert/strict";
import {
  createServer,
} from "node:net";
import test from "node:test";


test(
  "importing Runtime composition does not bind the Runtime port",
  async () => {
    const previous =
      process.env
        .LUMINA_RUNTIME_PORT;

    /*
     * Use an ephemeral known-free port so this test does not
     * interfere with an already-running production/dev Runtime.
     */
    const probe =
      createServer();

    await new Promise<void>(
      (
        resolve,
        reject,
      ) => {
        probe.once(
          "error",
          reject,
        );

        probe.listen(
          0,
          "127.0.0.1",
          () =>
            resolve(),
        );
      },
    );

    const address =
      probe.address();

    if (
      !address ||
      typeof address ===
        "string"
    ) {
      throw new Error(
        "runtime_import_safety_probe_address_missing",
      );
    }

    const port =
      address.port;

    await new Promise<void>(
      (
        resolve,
        reject,
      ) => {
        probe.close(
          error =>
            error
              ? reject(
                  error,
                )
              : resolve(),
        );
      },
    );

    process.env
      .LUMINA_RUNTIME_PORT =
      String(
        port,
      );

    try {
      await import(
        `../index.js?runtime-import-safety=${Date.now()}`
      );

      const verifier =
        createServer();

      await new Promise<void>(
        (
          resolve,
          reject,
        ) => {
          verifier.once(
            "error",
            reject,
          );

          verifier.listen(
            port,
            "127.0.0.1",
            () =>
              resolve(),
          );
        },
      );

      await new Promise<void>(
        (
          resolve,
          reject,
        ) => {
          verifier.close(
            error =>
              error
                ? reject(
                    error,
                  )
                : resolve(),
          );
        },
      );

      assert.ok(
        true,
      );
    } finally {
      if (
        previous ===
        undefined
      ) {
        delete process.env
          .LUMINA_RUNTIME_PORT;
      } else {
        process.env
          .LUMINA_RUNTIME_PORT =
          previous;
      }
    }
  },
);
