"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";

interface Props {
  phone: string;
  email: string;
}

export default function ContactBanner({ phone, email }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-none border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
      <span className="flex-1 min-w-0 font-heading">
        Dibuat oleh <strong className="text-foreground">Widi Diky</strong> — hubungi saya
      </span>
      <div className="flex gap-2 shrink-0">
        <Link
          href={`https://wa.me/${phone}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("contact_click")}
          className="inline-flex h-7 items-center rounded-none bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          WhatsApp
        </Link>
        <Link
          href={`mailto:${email}`}
          onClick={() => track("contact_click")}
          className="inline-flex h-7 items-center rounded-none border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Email
        </Link>
      </div>
    </div>
  );
}
