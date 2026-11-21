import { z } from "zod";
import { MENU } from "./menu";

export const orderSchema = z
  .object({
    items: z
      .array(
        z.object({
          menuId: z.string().refine((id) => MENU.some((m) => m.id === id), {
            message: "menuId tidak ada di menu",
          }),
          qty: z.number().int().min(1).max(20),
        })
      )
      .min(1)
      .max(20),
    fulfillment: z.enum(["antar", "ambil"]),
    name: z.string().min(1).max(60),
    address: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment === "antar" && !data.address?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "address wajib bila antar",
        path: ["address"],
      });
    }
  });

export type Order = z.infer<typeof orderSchema>;

export function summarize(order: Order): {
  lines: { name: string; qty: number; subtotal: number }[];
  total: number;
} {
  const lines = order.items.map((item) => {
    const menuItem = MENU.find((m) => m.id === item.menuId)!;
    return { name: menuItem.name, qty: item.qty, subtotal: menuItem.price * item.qty };
  });
  const total = lines.reduce((sum, l) => sum + l.subtotal, 0);
  return { lines, total };
}

export function buildWhatsAppLink(order: Order, phone: string): string {
  const { lines, total } = summarize(order);
  const itemLines = lines
    .map((l) => `- ${l.name} x${l.qty} = Rp${l.subtotal.toLocaleString("id-ID")}`)
    .join("\n");
  const fulfillmentText =
    order.fulfillment === "antar" ? `Antar ke: ${order.address}` : "Ambil sendiri";
  const message = [
    `[Demo] Pesanan dari ${order.name}`,
    "",
    itemLines,
    "",
    `Total: Rp${total.toLocaleString("id-ID")}`,
    fulfillmentText,
  ].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
