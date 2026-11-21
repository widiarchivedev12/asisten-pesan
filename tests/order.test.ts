import { test, expect } from "bun:test";
import { orderSchema, buildWhatsAppLink, summarize } from "@/lib/order";
import type { Order } from "@/lib/order";

const validOrder: Order = {
  items: [{ menuId: "paket-ayam", qty: 2 }],
  fulfillment: "ambil",
  name: "Budi",
};

test("qty 0, negatif, pecahan, dan 21 ditolak", () => {
  for (const qty of [0, -1, 0.5, 21]) {
    expect(
      orderSchema.safeParse({ ...validOrder, items: [{ menuId: "paket-ayam", qty }] }).success
    ).toBe(false);
  }
});

test("menuId yang tidak ada ditolak", () => {
  expect(
    orderSchema.safeParse({ ...validOrder, items: [{ menuId: "tidak-ada", qty: 1 }] }).success
  ).toBe(false);
});

test("antar tanpa alamat ditolak", () => {
  expect(
    orderSchema.safeParse({ ...validOrder, fulfillment: "antar" }).success
  ).toBe(false);
});

test("total dihitung dari harga menu, bukan dari input", () => {
  const { lines, total } = summarize(validOrder);
  // paket-ayam = Rp15.000, qty 2 → subtotal 30.000
  expect(lines[0].subtotal).toBe(30000);
  expect(total).toBe(30000);
});

test("link diawali https://wa.me/ dan pesannya diawali [Demo]", () => {
  const url = new URL(buildWhatsAppLink(validOrder, "6281234567890"));
  expect(url.href.startsWith("https://wa.me/")).toBe(true);
  expect(url.searchParams.get("text")!.startsWith("[Demo]")).toBe(true);
});

test("nama dengan emoji, baris baru, & dan # tetap utuh setelah decode", () => {
  const url = new URL(
    buildWhatsAppLink({ ...validOrder, name: "Budi 😀\n& #1" }, "6281234567890")
  );
  expect(url.searchParams.get("text")).toContain("Budi 😀\n& #1");
});
