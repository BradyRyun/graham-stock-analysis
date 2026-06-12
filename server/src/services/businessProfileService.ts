import {
  BusinessProfileData,
  BusinessProfileResponse,
} from "@stock-analyzer/shared";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { GeminiClient } from "./geminiClient.js";
import type { YahooFinanceClient } from "./yahooFinanceClient.js";

const GEMINI_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    businessDescription: {
      type: "string",
      description:
        "A clear, concise description of what the company does and its primary products or services",
    },
    businessModels: {
      type: "array",
      items: { type: "string" },
      description:
        "The company's core business models and primary revenue streams",
    },
    sector: {
      type: "string",
      description:
        "The primary sector or industry the company operates in",
    },
    coreThreats: {
      type: "array",
      items: { type: "string" },
      description:
        "Key competitive, regulatory, technological, or macroeconomic threats to the business",
    },
  },
  required: [
    "businessDescription",
    "businessModels",
    "sector",
    "coreThreats",
  ],
} as const;

type ProfileContext = {
  companyName: string | null;
  sector: string | null;
  industry: string | null;
};

type CachedProfileFile = {
  symbol: string;
  companyName: string | null;
  generatedAt: string;
  profile: BusinessProfileData;
};

export class BusinessProfileService {
  private profilesDir: string;

  constructor(
    dataDir: string,
    private geminiClient: GeminiClient,
    private yahooClient: YahooFinanceClient
  ) {
    this.profilesDir = join(dataDir, "business-profiles");
    mkdirSync(this.profilesDir, { recursive: true });
  }

  async getBusinessProfile(symbol: string): Promise<BusinessProfileResponse> {
    const normalizedSymbol = symbol.toUpperCase();
    const cached = this.readFromDisk(normalizedSymbol);
    if (cached) {
      return BusinessProfileResponse.parse({
        ...cached,
        cached: true,
      });
    }

    const context = await this.resolveContext(normalizedSymbol);
    const profile = await this.fetchFromGemini(normalizedSymbol, context);
    const generatedAt = new Date().toISOString();

    const stored: CachedProfileFile = {
      symbol: normalizedSymbol,
      companyName: context.companyName,
      generatedAt,
      profile,
    };

    this.writeToDisk(normalizedSymbol, stored);

    return BusinessProfileResponse.parse({
      ...stored,
      cached: false,
    });
  }

  private profilePath(symbol: string): string {
    return join(this.profilesDir, `${symbol}.json`);
  }

  private readFromDisk(symbol: string): CachedProfileFile | null {
    const path = this.profilePath(symbol);
    if (!existsSync(path)) {
      return null;
    }

    try {
      const raw = readFileSync(path, "utf-8");
      const parsed = JSON.parse(raw) as unknown;
      const result = BusinessProfileResponse.omit({ cached: true }).safeParse(
        parsed
      );
      if (!result.success) {
        console.warn(
          `Invalid business profile cache for ${symbol}, ignoring:`,
          result.error.message
        );
        return null;
      }
      return result.data;
    } catch (error) {
      console.warn(`Failed to read business profile cache for ${symbol}:`, error);
      return null;
    }
  }

  private writeToDisk(symbol: string, data: CachedProfileFile): void {
    writeFileSync(this.profilePath(symbol), JSON.stringify(data, null, 2), "utf-8");
  }

  private async resolveContext(symbol: string): Promise<ProfileContext> {
    try {
      const data = await this.yahooClient.getSymbolData(symbol, "1y", false);
      return {
        companyName: data.quoteExtras.companyName,
        sector: data.quoteExtras.sector,
        industry: data.quoteExtras.industry,
      };
    } catch {
      return { companyName: null, sector: null, industry: null };
    }
  }

  private async fetchFromGemini(
    symbol: string,
    context: ProfileContext
  ): Promise<BusinessProfileData> {
    const contextLines = [
      `Ticker: ${symbol}`,
      context.companyName ? `Company: ${context.companyName}` : null,
      context.sector ? `Known sector: ${context.sector}` : null,
      context.industry ? `Known industry: ${context.industry}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const content = await this.geminiClient.generateStructuredJson(
      "You are a financial analyst providing factual, balanced business profiles for publicly traded companies. Be concise and specific. Focus on the company's actual operations, not stock price commentary.",
      `Provide a business profile for this publicly traded company:\n\n${contextLines}`,
      GEMINI_RESPONSE_SCHEMA
    );

    const parsed = BusinessProfileData.safeParse(JSON.parse(content));
    if (!parsed.success) {
      throw new Error(
        `Gemini response failed validation: ${parsed.error.message}`
      );
    }

    return parsed.data;
  }
}
