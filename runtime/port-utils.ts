import net from "net";

export function getFreePort(start = 4100, end = 5000): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryPort = (port: number) => {
      if (port > end) return reject(new Error("No free ports"));

      const server = net.createServer();
      server.once("error", () => {
        tryPort(port + 1);
      });

      server.once("listening", () => {
        server.close(() => resolve(port));
      });

      server.listen(port, "127.0.0.1");
    };

    tryPort(start);
  });
}
