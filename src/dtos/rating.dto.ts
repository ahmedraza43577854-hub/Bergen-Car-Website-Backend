export type DealerRating = {
  combinedRating: number;
  totalReviews: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Accepts the AutoSalesReviews dealer object, or `{ data: dealer }`. */
export function parseDealerRating(payload: unknown): DealerRating | null {
  const root = asRecord(payload);
  if (!root) return null;

  const nested = asRecord(root.data);
  const src =
    nested && ("combinedRating" in nested || "totalReviews" in nested)
      ? nested
      : root;

  const combinedRating = Number(src.combinedRating);
  const totalReviews = Math.trunc(Number(src.totalReviews));

  if (!Number.isFinite(combinedRating) || combinedRating <= 0 || combinedRating > 5) {
    return null;
  }
  if (!Number.isFinite(totalReviews) || totalReviews <= 0) {
    return null;
  }

  return { combinedRating, totalReviews };
}
