"use client";

import { useState, useRef, useCallback } from "react";
import { track } from "@vercel/analytics";
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
import { Separator } from "@/components/ui/separator";
import OrderSummary from "@/components/OrderSummary";
import ContactBanner from "@/components/ContactBanner";
import { orderSchema, type Order } from "@/lib/order";
import { WARUNG_NAME } from "@/lib/menu";
import { RiSendPlaneLine } from "@remixicon/react";

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
      content: `Halo! Selamat datang di ${WARUNG_NAME}. Ada yang bisa saya bantu? Mau lihat menu atau langsung pesan?`,
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

      // Parse SSE stream
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
      <MessageScrollerProvider>
        <MessageScroller className="flex-1 min-h-0">
          <MessageScrollerViewport>
            <MessageScrollerContent className="p-4">
              {messages.map((msg, i) => (
                <MessageScrollerItem key={i} scrollAnchor={i === messages.length - 1}>
                  <div
                    className={
                      msg.role === "user" ? "flex justify-end" : "flex justify-start"
                    }
                  >
                    <BubbleGroup>
                      <Bubble
                        variant={msg.role === "user" ? "default" : "muted"}
                        align={msg.role === "user" ? "end" : "start"}
                      >
                        <BubbleContent className="whitespace-pre-wrap">
                          {msg.content}
                          {msg.role === "assistant" && isLoading && i === messages.length - 1 && !msg.content && (
                            <Spinner className="size-3" />
                          )}
                        </BubbleContent>
                      </Bubble>
                    </BubbleGroup>
                  </div>
                </MessageScrollerItem>
              ))}

              {order && (
                <MessageScrollerItem scrollAnchor>
                  <div className="mt-2">
                    <OrderSummary order={order} phone={phone} />
                  </div>
                </MessageScrollerItem>
              )}

              {showContact && (
                <MessageScrollerItem scrollAnchor>
                  <div className="mt-2">
                    <ContactBanner phone={phone} email={contactEmail} />
                  </div>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="shrink-0">
        <Separator />
        <div className="flex gap-2 p-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan…"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none min-h-0"
          />
          <Button
            onClick={submit}
            disabled={!input.trim() || isLoading}
            size="icon"
            aria-label="Kirim"
          >
            {isLoading ? <Spinner /> : <RiSendPlaneLine />}
          </Button>
        </div>
      </div>
    </div>
  );
}
