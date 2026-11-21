import { test, expect } from "bun:test";
import { checkAndConsume, dayKey } from "@/lib/limits";
import { memoryStore } from "@/lib/store";
import type { CounterStore } from "@/lib/store";

test("pengunjung ditolak setelah melewati batas pribadi", async () => {
  const store = memoryStore();
  const cfg = { perVisitor: 2, global: 100 };
  expect(await checkAndConsume("v1", store, cfg)).toEqual({ allowed: true });
  expect(await checkAndConsume("v1", store, cfg)).toEqual({ allowed: true });
  expect(await checkAndConsume("v1", store, cfg)).toEqual({ allowed: false, reason: "visitor" });
});

test("batas harian total menahan pengunjung berbeda (cookie baru)", async () => {
  const store = memoryStore();
  const cfg = { perVisitor: 100, global: 3 };
  expect(await checkAndConsume("v1", store, cfg)).toEqual({ allowed: true });
  expect(await checkAndConsume("v2", store, cfg)).toEqual({ allowed: true });
  expect(await checkAndConsume("v3", store, cfg)).toEqual({ allowed: true });
  expect(await checkAndConsume("v4", store, cfg)).toEqual({ allowed: false, reason: "daily" });
});

test("hari berganti menurut waktu Jakarta, bukan UTC", () => {
  // 2026-11-22T17:30:00Z = 2026-11-23T00:30:00+07:00
  expect(dayKey(new Date("2026-11-22T17:30:00Z"))).toBe("2026-11-23");
});

test("store melempar error -> gagal tertutup", async () => {
  const brokenStore: CounterStore = {
    incr: () => Promise.reject(new Error("connection refused")),
  };
  const cfg = { perVisitor: 10, global: 100 };
  expect(await checkAndConsume("v1", brokenStore, cfg)).toEqual({
    allowed: false,
    reason: "unavailable",
  });
});
