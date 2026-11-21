import { MENU } from "@/lib/menu";
import { test, expect } from "bun:test";

test("id menu unik dan harga bilangan bulat positif", () => {
  expect(new Set(MENU.map((i) => i.id)).size).toBe(MENU.length);
  expect(MENU.every((i) => Number.isInteger(i.price) && i.price > 0)).toBe(
    true
  );
});
