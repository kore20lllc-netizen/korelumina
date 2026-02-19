const http = require("http");

const PORT = 3101;

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/preview/start") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const { workspaceId, projectId } = JSON.parse(body);

        console.log("[previewd] start request:", workspaceId, projectId);

        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            ok: true,
            workspaceId,
            projectId,
          })
        );
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log("previewd listening on", PORT);
});
