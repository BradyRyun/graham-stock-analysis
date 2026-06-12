import {
  BusinessProfileResponse,
  MetricsPeriod,
  StockMetricsResponse,
  StockSearchResponse,
} from "@stock-analyzer/shared";
import { Router } from "express";
import type { BusinessProfileService } from "../services/businessProfileService.js";
import { calculateStockMetrics } from "../services/metricsCalculator.js";
import type { YahooFinanceClient } from "../services/yahooFinanceClient.js";
import type { PolygonClient } from "../services/polygonClient.js";

export function createStocksRouter(
  yahooClient: YahooFinanceClient,
  polygonClient: PolygonClient,
  riskFreeRate: number,
  businessProfileService: BusinessProfileService | null
): Router {
  const router = Router();

  router.get("/search", async (req, res, next) => {
    try {
      const q = String(req.query.q ?? "").trim();
      if (q.length < 1) {
        res.json(StockSearchResponse.parse({ results: [] }));
        return;
      }

      const results = await yahooClient.searchSymbols(q);
      res.json(StockSearchResponse.parse({ results }));
    } catch (e) {
      next(e);
    }
  });

  router.get("/:symbol/metrics", async (req, res, next) => {
    try {
      const symbol = String(req.params.symbol).toUpperCase();
      const periodResult = MetricsPeriod.safeParse(req.query.period ?? "1y");
      if (!periodResult.success) {
        res.status(400).json({ message: "period must be 1y or 3y" });
        return;
      }

      const forceRefresh = String(req.query.forceRefresh) === "true";
      const metrics = await calculateStockMetrics(
        yahooClient,
        symbol,
        periodResult.data,
        riskFreeRate,
        forceRefresh,
        polygonClient
      );

      res.json(StockMetricsResponse.parse(metrics));
    } catch (e) {
      next(e);
    }
  });

  router.get("/:symbol/business-profile", async (req, res, next) => {
    try {
      if (!businessProfileService) {
        res.status(503).json({
          message:
            "Business profiles are unavailable. Set GEMINI_API_KEY or configure GOOGLE_APPLICATION_CREDENTIALS with GCP_PROJECT_ID for Vertex AI.",
        });
        return;
      }

      const symbol = String(req.params.symbol).toUpperCase();
      const profile = await businessProfileService.getBusinessProfile(symbol);
      res.json(BusinessProfileResponse.parse(profile));
    } catch (e) {
      next(e);
    }
  });

  return router;
}
