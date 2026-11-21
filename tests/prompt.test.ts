import { test, expect } from "bun:test";
import { buildSystemPrompt } from "@/lib/prompt";
import { MENU, WARUNG_NAME } from "@/lib/menu";

test("prompt memuat semua nama menu dan harga", () => {
  const prompt = buildSystemPrompt(MENU);
  for (const item of MENU) {
    expect(prompt).toContain(item.name);
    expect(prompt).toContain(item.price.toLocaleString("id-ID"));
  }
});

test("prompt menyebut WARUNG_NAME", () => {
  const prompt = buildSystemPrompt(MENU);
  expect(prompt).toContain(WARUNG_NAME);
});

test("prompt menyuruh asisten menolak topik di luar menu", () => {
  const prompt = buildSystemPrompt(MENU).toLowerCase();
  expect(prompt).toMatch(/jangan|tolak|hanya|luar/);
});

test("prompt menyuruh asisten menolak permintaan mengubah aturan", () => {
  const prompt = buildSystemPrompt(MENU).toLowerCase();
  expect(prompt).toMatch(/aturan|instruksi|abaikan|ubah/);
});

test("prompt menggunakan bahasa Indonesia santai (kamu, bukan Anda)", () => {
  const prompt = buildSystemPrompt(MENU);
  expect(prompt).toMatch(/kamu/i);
  expect(prompt).not.toMatch(/\bAnda\b/);
});
