import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type CacheTtlHours = {
  fundamentals: number;
  prices: number;
  search: number;
};

const defaultTtl: CacheTtlHours = {
  fundamentals: 24,
  prices: 12,
  search: 168,
};

export class CacheService {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    const schema = readFileSync(
      join(__dirname, "../db/schema.sql"),
      "utf-8"
    );
    this.db.exec(schema);
  }

  get(key: string): unknown | null {
    const row = this.db
      .prepare(
        `SELECT payload, expires_at FROM api_cache WHERE cache_key = ?`
      )
      .get(key) as { payload: string; expires_at: string } | undefined;

    if (!row) return null;

    if (new Date(row.expires_at) <= new Date()) {
      this.db.prepare(`DELETE FROM api_cache WHERE cache_key = ?`).run(key);
      return null;
    }

    return JSON.parse(row.payload) as unknown;
  }

  set(key: string, payload: unknown, ttlHours: number): void {
    const now = new Date();
    const expires = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

    this.db
      .prepare(
        `INSERT INTO api_cache (cache_key, payload, fetched_at, expires_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(cache_key) DO UPDATE SET
           payload = excluded.payload,
           fetched_at = excluded.fetched_at,
           expires_at = excluded.expires_at`
      )
      .run(
        key,
        JSON.stringify(payload),
        now.toISOString(),
        expires.toISOString()
      );
  }

  ttlForKey(key: string): number {
    if (key.startsWith("YAHOO:SEARCH:")) return defaultTtl.search;
    if (key.startsWith("YAHOO:SYMBOL_DATA:")) return defaultTtl.prices;
    return defaultTtl.fundamentals;
  }
}
