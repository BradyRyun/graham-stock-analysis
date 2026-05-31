import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createStocksRouter } from "./routes/stocks.js";
import { CacheService } from "./services/cache.js";
import { YahooFinanceClient } from "./services/yahooFinanceClient.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../../.env") });
dotenv.config();

const dataDir = join(__dirname, "../data");
mkdirSync(dataDir, { recursive: true });

const port = Number(process.env.PORT ?? 3001);
const riskFreeRate = Number(process.env.RISK_FREE_RATE ?? 0.04);
const corsOrigin = process.env.CORS_ORIGIN;

const cache = new CacheService(join(dataDir, "cache.db"));
const yahooClient = new YahooFinanceClient(cache);

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (/^http:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
        return;
      }
      if (corsOrigin && origin === corsOrigin) {
        callback(null, true);
        return;
      }
      callback(null, corsOrigin ?? true);
    },
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/stocks", createStocksRouter(yahooClient, riskFreeRate));

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ message: err.message ?? "Internal server error" });
  }
);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
