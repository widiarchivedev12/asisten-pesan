import * as m from "@/lib/messages";
import { test, expect } from "bun:test";

const FORBIDDEN = /kuota|rate ?limit|error|api|token|429|server/i;

test.each([
  "MSG_VISITOR_LIMIT",
  "MSG_DAILY_LIMIT",
  "MSG_BUSY",
  "MSG_BAD_INPUT",
] as const)("%s tidak memuat istilah teknis", (k) => {
  expect(m[k]).not.toMatch(FORBIDDEN);
});

test("pesan batas menyebut Widi", () => {
  expect(m.MSG_VISITOR_LIMIT).toMatch(/Widi/);
  expect(m.MSG_DAILY_LIMIT).toMatch(/Widi/);
});
