import { env } from "../config/env";
import { ServiceUnavailableError } from "../errors/AppError";
import type { InventoryVehicle, UpstreamVehicle } from "../dtos/vehicle.dto";
import { mapUpstreamVehicle } from "./inventory.mapper";

const REFRESH_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;

type CacheSnapshot = {
  vehicles: InventoryVehicle[];
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
    if (!this.snapshot) {
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

    const cached = this.snapshot;
    if (cached) return cached.vehicles;
    throw new ServiceUnavailableError(
      "Inventory is temporarily unavailable. Please try again shortly."
    );
  }

  private async refresh(): Promise<void> {
    if (this.refreshInFlight) return this.refreshInFlight;

    this.refreshInFlight = this.fetchAndStore().finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }

  private async fetchAndStore(): Promise<void> {
    const url = `${env.autosalesreviews.apiUrl}/api/vehicles/dealer/${env.autosalesreviews.dealerSlug}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-internal-key": env.autosalesreviews.internalApiKey,
        },
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

      const json = (await response.json()) as { data?: UpstreamVehicle[] };
      if (!Array.isArray(json.data)) {
        throw new Error("AutoSalesReviews response is missing data[]");
      }

      this.snapshot = {
        vehicles: json.data.map(mapUpstreamVehicle),
        fetchedAt: new Date(),
      };
      console.info(
        `[inventory] cached ${this.snapshot.vehicles.length} vehicles from AutoSalesReviews at ${this.snapshot.fetchedAt.toISOString()}`
      );
    } catch (error) {
      console.error("[inventory] upstream refresh failed:", error);
      if (this.snapshot) {
        console.warn(
          `[inventory] serving last good cache (${this.snapshot.vehicles.length} vehicles, fetched ${this.snapshot.fetchedAt.toISOString()})`
        );
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const inventoryService = new InventoryService();
