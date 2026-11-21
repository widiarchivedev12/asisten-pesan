"use client";

import { useState, useRef, useCallback } from "react";
import { track } from "@vercel/analytics";
import Link from "next/link";
import {
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
  MessageScrollerProvider,
} from "@/components/ui/message-scroller";
import { Bubble, BubbleContent, BubbleGroup } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import OrderSummary from "@/components/OrderSummary";
import { orderSchema, type Order } from "@/lib/order";
import { WARUNG_NAME } from "@/lib/menu";
import { RiSendPlaneFill, RiWhatsappLine, RiMailLine, RiStoreLine } from "@remixicon/react";
import Markdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  phone: string;
  contactEmail: string;
}

export default function Chat({ phone, contactEmail }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Halo! Selamat datang di ${WARUNG_NAME}.\n\nSaya bisa bantu kamu lihat menu, cek harga, atau langsung pesan. Mau mulai dari mana?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [showContact, setShowContact] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        const { message } = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: message }]);
        setShowContact(true);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let toolCallName = "";
      let toolCallArgs = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const chunk = JSON.parse(raw);
            const delta = chunk.choices?.[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
              assistantText += delta.content;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantText };
                return copy;
              });
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.function?.name) toolCallName = tc.function.name;
                if (tc.function?.arguments) toolCallArgs += tc.function.arguments;
              }
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }

      if (toolCallName === "submitOrder" && toolCallArgs) {
        try {
          const parsed = orderSchema.safeParse(JSON.parse(toolCallArgs));
          if (parsed.success) {
            setOrder(parsed.data);
            track("order_created");
          }
        } catch {
          // ignore parse errors
        }
      }
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 bg-emerald-700 px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15">
              <RiStoreLine className="size-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-200">Demo Asisten Pesan</p>
              <h1 className="font-heading text-base font-semibold leading-tight">{WARUNG_NAME}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            {phone && (
              <Link
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("contact_click")}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25 transition-colors"
              >
                <RiWhatsappLine className="size-3.5" />
                Hubungi Widi
              </Link>
            )}
            {contactEmail && (
              <Link
                href={`mailto:${contactEmail}`}
                onClick={() => track("contact_click")}
                className="inline-flex items-center rounded-full bg-white/15 p-1.5 text-white hover:bg-white/25 transition-colors"
                aria-label="Email"
              >
                <RiMailLine className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Chat area */}
      <MessageScrollerProvider>
        <MessageScroller className="flex-1 min-h-0 bg-stone-50">
          <MessageScrollerViewport>
            <MessageScrollerContent className="px-4 py-4">
              {messages.map((msg, i) => (
                <MessageScrollerItem key={i} scrollAnchor={i === messages.length - 1}>
                  <div className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <BubbleGroup className={msg.role === "user" ? "min-w-fit" : ""}>
                      <Bubble
                        variant={msg.role === "user" ? "default" : "outline"}
                        align={msg.role === "user" ? "end" : "start"}
                        className="max-w-[85%]"
                      >
                        <BubbleContent className="text-sm leading-relaxed min-w-8">
                          {msg.role === "assistant" ? (
                            msg.content
                              ? <div className="prose prose-sm prose-neutral max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"><Markdown>{msg.content}</Markdown></div>
                              : isLoading && i === messages.length - 1
                                ? <Spinner className="size-3.5" />
                                : null
                          ) : (
                            <span className="whitespace-pre-wrap wrap-break-word">{msg.content}</span>
                          )}
                        </BubbleContent>
                      </Bubble>
                    </BubbleGroup>
                  </div>
                </MessageScrollerItem>
              ))}

              {order && (
                <MessageScrollerItem scrollAnchor>
                  <div className="mt-3">
                    <OrderSummary order={order} phone={phone} />
                  </div>
                </MessageScrollerItem>
              )}

              {showContact && !order && (
                <MessageScrollerItem scrollAnchor>
                  <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <p className="font-medium mb-1">Tertarik buat yang serupa?</p>
                    <p className="text-xs text-emerald-600 mb-2">Hubungi Widi untuk lihat demo atau diskusi kebutuhan usahamu.</p>
                    <div className="flex gap-2">
                      {phone && (
                        <Link
                          href={`https://wa.me/${phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => track("contact_click")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                        >
                          <RiWhatsappLine className="size-3" />
                          WhatsApp
                        </Link>
                      )}
                      {contactEmail && (
                        <Link
                          href={`mailto:${contactEmail}`}
                          onClick={() => track("contact_click")}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <RiMailLine className="size-3" />
                          Email
                        </Link>
                      )}
                    </div>
                  </div>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      {/* Input area */}
      <div className="shrink-0 bg-white border-t border-stone-200 px-3 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan…"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none min-h-0 max-h-32 rounded-xl border-stone-200 bg-stone-50 text-sm focus-visible:border-emerald-400 focus-visible:ring-emerald-200"
          />
          <Button
            onClick={submit}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 rounded-xl size-9 bg-emerald-600 hover:bg-emerald-700 text-white"
            aria-label="Kirim"
          >
            {isLoading ? <Spinner className="size-3.5" /> : <RiSendPlaneFill className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
