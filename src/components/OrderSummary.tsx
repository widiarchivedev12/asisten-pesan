import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { summarize, buildWhatsAppLink, type Order } from "@/lib/order";
import { cn } from "@/lib/utils";

interface Props {
  order: Order;
  phone: string;
}

export default function OrderSummary({ order, phone }: Props) {
  const { lines, total } = summarize(order);
  const waUrl = buildWhatsAppLink(order, phone);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ringkasan Pesanan</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {lines.map((line) => (
            <li key={line.name} className="flex justify-between gap-4 text-xs">
              <span>
                {line.name} ×{line.qty}
              </span>
              <span>Rp{line.subtotal.toLocaleString("id-ID")}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-xs font-semibold">
          <span>Total</span>
          <span>Rp{total.toLocaleString("id-ID")}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-full")}
        >
          Kirim pesanan lewat WhatsApp
        </Link>
      </CardFooter>
    </Card>
  );
}
