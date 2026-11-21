import type { CounterStore } from "./store";

export type LimitConfig = { perVisitor: number; global: number };
export type LimitResult =
  | { allowed: true }
  | { allowed: false; reason: "visitor" | "daily" | "unavailable" };

const TTL = 48 * 60 * 60; // 48 hours

export function dayKey(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
}

export async function checkAndConsume(
  visitorId: string,
  store: CounterStore,
  cfg: LimitConfig,
  now: Date = new Date()
): Promise<LimitResult> {
  try {
    const day = dayKey(now);

    const visitorCount = await store.incr(`v:${day}:${visitorId}`, TTL);
    if (visitorCount > cfg.perVisitor) return { allowed: false, reason: "visitor" };

    const globalCount = await store.incr(`g:${day}`, TTL);
    if (globalCount > cfg.global) return { allowed: false, reason: "daily" };

    return { allowed: true };
  } catch {
    return { allowed: false, reason: "unavailable" };
  }
}
