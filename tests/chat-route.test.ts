import { mock, test, expect, beforeEach } from "bun:test";
import { MSG_BAD_INPUT, MSG_VISITOR_LIMIT, MSG_DAILY_LIMIT, MSG_BUSY } from "@/lib/messages";

// --- mutable mock state (captured by closure; safe to mutate between tests) ---

type IncrBehavior = "normal" | "visitorFull" | "globalFull" | "throw";
let incrBehavior: IncrBehavior = "normal";
let normalCount = 0;
let axiosShouldThrow = false;

mock.module("@/lib/store", () => ({
  upstashStore: () => ({
    incr: async (key: string, _ttl: number) => {
      if (incrBehavior === "throw") throw new Error("Redis down");
      if (incrBehavior === "visitorFull" && key.startsWith("v:")) return 999;
      if (incrBehavior === "globalFull" && key.startsWith("g:")) return 999;
      return ++normalCount;
    },
  }),
  memoryStore: () => {
    const counts = new Map<string, number>();
    return {
      incr: async (key: string, _ttl: number) => {
        const n = (counts.get(key) ?? 0) + 1;
        counts.set(key, n);
        return n;
      },
    };
  },
}));

mock.module("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "visitor_id" ? { value: "test-visitor" } : undefined,
      set: () => {},
    }),
}));

mock.module("axios", () => ({
  default: {
    post: async () => {
      if (axiosShouldThrow) throw new Error("NVIDIA error");
      const { Readable } = require("node:stream");
      const s = new Readable({ read() { this.push(null); } });
      return { data: s };
    },
  },
}));

const { POST } = await import("@/app/api/chat/route");

function req(messages: unknown[]) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
}

beforeEach(() => {
  incrBehavior = "normal";
  normalCount = 0;
  axiosShouldThrow = false;
});

test("pesan kosong → 400 MSG_BAD_INPUT tanpa memanggil NVIDIA", async () => {
  const res = await POST(req([{ role: "user", content: "" }]));
  expect(res.status).toBe(400);
  expect((await res.json()).message).toBe(MSG_BAD_INPUT);
});

test("pesan > 500 karakter → 400 MSG_BAD_INPUT tanpa memanggil NVIDIA", async () => {
  const res = await POST(req([{ role: "user", content: "a".repeat(501) }]));
  expect(res.status).toBe(400);
  expect((await res.json()).message).toBe(MSG_BAD_INPUT);
});

test("batas pengunjung terlampaui → 429 MSG_VISITOR_LIMIT", async () => {
  incrBehavior = "visitorFull";
  const res = await POST(req([{ role: "user", content: "halo" }]));
  expect(res.status).toBe(429);
  expect((await res.json()).message).toBe(MSG_VISITOR_LIMIT);
});

test("batas harian terlampaui → 429 MSG_DAILY_LIMIT", async () => {
  incrBehavior = "globalFull";
  const res = await POST(req([{ role: "user", content: "halo" }]));
  expect(res.status).toBe(429);
  expect((await res.json()).message).toBe(MSG_DAILY_LIMIT);
});

test("store error → 429 MSG_BUSY tanpa teks error asli", async () => {
  incrBehavior = "throw";
  const res = await POST(req([{ role: "user", content: "halo" }]));
  expect(res.status).toBe(429);
  const body = await res.json();
  expect(body.message).toBe(MSG_BUSY);
  expect(body.message).not.toContain("Redis");
});

test("NVIDIA error → 429 MSG_BUSY tanpa teks error asli", async () => {
  axiosShouldThrow = true;
  const res = await POST(req([{ role: "user", content: "halo" }]));
  expect(res.status).toBe(429);
  const body = await res.json();
  expect(body.message).toBe(MSG_BUSY);
  expect(body.message).not.toContain("NVIDIA");
});
