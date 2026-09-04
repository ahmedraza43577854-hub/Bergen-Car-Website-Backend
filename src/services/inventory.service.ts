import { env } from "../config/env";
import { ServiceUnavailableError } from "../errors/AppError";
import { parseDealerRating, type DealerRating } from "../dtos/rating.dto";
import type { InventoryVehicle, UpstreamVehicle } from "../dtos/vehicle.dto";
import { mapUpstreamVehicle } from "./inventory.mapper";

const REFRESH_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;

type CacheSnapshot = {
  vehicles: InventoryVehicle[];
  rating: DealerRating | null;
  fetchedAt: Date;
};

class InventoryService {
  private snapshot: CacheSnapshot | null = null;
  private timer: NodeJS.Timeout | null = null;
  private refreshInFlight: Promise<void> | null = null;

  start(): void {
    void this.refresh().catch(() => {
      /* fetchAndStore logs; a cold miss is surfaced as 503 on read */
    });
    this.timer = setInterval(() => {
      void this.refresh().catch(() => {});
    }, REFRESH_MS);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Reads the in-memory snapshot only. Never calls AutoSalesReviews. */
  async getInventory(): Promise<InventoryVehicle[]> {
    await this.ensureSnapshot();
    const cached = this.snapshot;
    if (cached) return cached.vehicles;
    throw new ServiceUnavailableError(
      "Inventory is temporarily unavailable. Please try again shortly."
    );
  }

  /** Cached dealer rating. Returns null instead of 503 so the badge can stay empty. */
  async getRating(): Promise<DealerRating | null> {
    await this.ensureSnapshot();
    return this.snapshot?.rating ?? null;
  }

  private async ensureSnapshot(): Promise<void> {
    if (this.snapshot) return;
    try {
      if (this.refreshInFlight) {
        await this.refreshInFlight;
      } else {
        await this.refresh();
      }
    } catch {
      /* logged in fetchAndStore */
    }
  }

  private async refresh(): Promise<void> {
    if (this.refreshInFlight) return this.refreshInFlight;

    this.refreshInFlight = this.fetchAndStore().finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }

  private async fetchAndStore(): Promise<void> {
    try {
      const vehicles = await this.fetchVehicles();
      const rating =
        (await this.fetchDealerRating()) ?? this.snapshot?.rating ?? null;

      this.snapshot = {
        vehicles,
        rating,
        fetchedAt: new Date(),
      };
      console.info(
        `[inventory] cached ${this.snapshot.vehicles.length} vehicles from AutoSalesReviews at ${this.snapshot.fetchedAt.toISOString()}` +
          (rating
            ? ` (rating ${rating.combinedRating}/5, ${rating.totalReviews} reviews)`
            : " (no dealer rating)")
      );
    } catch (error) {
      console.error("[inventory] upstream refresh failed:", error);
      if (this.snapshot) {
        console.warn(
          `[inventory] serving last good cache (${this.snapshot.vehicles.length} vehicles, fetched ${this.snapshot.fetchedAt.toISOString()})`
        );
      }
    }
  }

  private dealerHeaders(): Record<string, string> {
    return {
      Accept: "application/json",
      "x-internal-key": env.autosalesreviews.internalApiKey,
    };
  }

  private async fetchJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.dealerHeaders(),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(
          `AutoSalesReviews ${response.status} ${response.statusText}${
            body ? `: ${body.slice(0, 300)}` : ""
          }`
        );
      }

      return (await response.json()) as unknown;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchVehicles(): Promise<InventoryVehicle[]> {
    const url = `${env.autosalesreviews.apiUrl}/api/vehicles/dealer/${env.autosalesreviews.dealerSlug}`;
    const json = (await this.fetchJson(url)) as { data?: UpstreamVehicle[] };
    if (!Array.isArray(json.data)) {
      throw new Error("AutoSalesReviews response is missing data[]");
    }
    return json.data.map(mapUpstreamVehicle);
  }

  private async fetchDealerRating(): Promise<DealerRating | null> {
    const url = `${env.autosalesreviews.apiUrl}/api/dealers/${env.autosalesreviews.dealerSlug}`;
    try {
      const json = await this.fetchJson(url);
      const rating = parseDealerRating(json);
      if (!rating) {
        console.warn("[inventory] AutoSalesReviews dealer payload had no usable combinedRating/totalReviews");
      }
      return rating;
    } catch (error) {
      console.error("[inventory] dealer rating refresh failed:", error);
      return null;
    }
  }
}

export const inventoryService = new InventoryService();
