import http from "node:http";

function ping(
  url: string,
): Promise<boolean> {
  return new Promise(
    (resolve) => {
      const req =
        http.get(
          url,
          (res) => {
            const contentType =
              String(
                res.headers[
                  "content-type"
                ] || "",
              );

            const valid =
              !!res.statusCode &&
              res.statusCode <
                500 &&
              (
                contentType.includes(
                  "text/html",
                ) ||
                contentType.includes(
                  "application/json",
                ) ||
                contentType.includes(
                  "javascript",
                )
              );

            resolve(valid);

            res.resume();
          },
        );

      req.on(
        "error",
        () => {
          resolve(false);
        },
      );

      req.setTimeout(
        3000,
        () => {
          req.destroy();
          resolve(false);
        },
      );
    },
  );
}

export async function waitForRuntime(
  url: string,
  timeoutMs = 45000,
) {
  const startedAt =
    Date.now();

  let successCount = 0;

  while (
    Date.now() -
      startedAt <
    timeoutMs
  ) {
    const ready =
      await ping(url);

    if (ready) {
      successCount += 1;
    } else {
      successCount = 0;
    }

    if (
      successCount >= 2
    ) {
      return true;
    }

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          1200,
        ),
    );
  }

  throw new Error(
    `Runtime failed to become ready: ${url}`,
  );
}
