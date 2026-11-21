import { test, expect } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import OrderSummary from "@/components/OrderSummary";
import ContactBanner from "@/components/ContactBanner";
import type { Order } from "@/lib/order";

const validOrder: Order = {
  items: [
    { menuId: "paket-ayam", qty: 2 },
    { menuId: "minum-teh", qty: 1 },
  ],
  fulfillment: "ambil",
  name: "Budi",
};

test("OrderSummary menampilkan total yang benar", () => {
  const html = renderToStaticMarkup(
    <OrderSummary order={validOrder} phone="6281234567890" />
  );
  // paket-ayam: 15000 * 2 = 30000; minum-teh: 3000 * 1 = 3000; total 33000
  expect(html).toContain("33.000");
});

test("OrderSummary menampilkan nama item", () => {
  const html = renderToStaticMarkup(
    <OrderSummary order={validOrder} phone="6281234567890" />
  );
  expect(html).toContain("Paket Nasi Ayam Goreng");
  expect(html).toContain("Es Teh Manis");
});

test("OrderSummary href tombol diawali https://wa.me/", () => {
  const html = renderToStaticMarkup(
    <OrderSummary order={validOrder} phone="6281234567890" />
  );
  expect(html).toContain("https://wa.me/6281234567890");
});

test("OrderSummary teks tombol mengandung kata kirim atau pesan", () => {
  const html = renderToStaticMarkup(
    <OrderSummary order={validOrder} phone="6281234567890" />
  );
  expect(html.toLowerCase()).toMatch(/kirim|pesan/);
});

test("ContactBanner menampilkan tautan WhatsApp dari props", () => {
  const html = renderToStaticMarkup(
    <ContactBanner phone="6281234567890" email="widi@example.com" />
  );
  expect(html).toContain("https://wa.me/6281234567890");
});

test("ContactBanner menampilkan tautan email dari props", () => {
  const html = renderToStaticMarkup(
    <ContactBanner phone="6281234567890" email="widi@example.com" />
  );
  expect(html).toContain("mailto:widi@example.com");
});

test("ContactBanner menyebut Widi", () => {
  const html = renderToStaticMarkup(
    <ContactBanner phone="6281234567890" email="widi@example.com" />
  );
  expect(html).toContain("Widi");
});
