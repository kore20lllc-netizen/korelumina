import express from "express";
import cors from "cors";

import { registerStartRoute } from "./routes/start.js";
import { registerStatusRoute } from "./routes/status.js";

const app = express();

app.use(cors());
app.use(express.json());

registerStartRoute(app);
registerStatusRoute(app);

const PORT = 4100;

app.listen(PORT, () => {
  console.log(`[lumina-runtime] listening on ${PORT}`);
});
