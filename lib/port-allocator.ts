import net from "net";

const BASE_PORT = 4100;
const MAX_PORT = 5000;

function isPortFree(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        server.close();
        resolve(true);
      })
      .listen(port, "0.0.0.0");
  });
}

export async function allocatePort(_workspaceId: string): Promise<number> {
  for (let port = BASE_PORT; port <= MAX_PORT; port++) {
    if (await isPortFree(port)) {
      return port;
    }
  }

  throw new Error("No free preview ports available");
}

export function buildPreviewUrl(port: number) {
  return `http://localhost:${port}`;
}
