import axios from "axios";
import { Readable } from "node:stream";
import { cookies } from "next/headers";
import { z } from "zod";
import { checkAndConsume } from "@/lib/limits";
import { upstashStore } from "@/lib/store";
import { buildSystemPrompt } from "@/lib/prompt";
import { MENU } from "@/lib/menu";
import {
  MSG_VISITOR_LIMIT,
  MSG_DAILY_LIMIT,
  MSG_BUSY,
  MSG_BAD_INPUT,
} from "@/lib/messages";

export const runtime = "nodejs";

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const MAX_MSG_LENGTH = 500;

const submitOrderTool = {
  type: "function",
  function: {
    name: "submitOrder",
    description:
      "Panggil ini setelah pelanggan mengkonfirmasi semua detail pesanan (item, jumlah, nama, cara pengambilan)",
    parameters: {
      type: "object",
      required: ["items", "fulfillment", "name"],
      properties: {
        items: {
          type: "array",
          minItems: 1,
          maxItems: 20,
          items: {
            type: "object",
            required: ["menuId", "qty"],
            properties: {
              menuId: { type: "string", description: "ID menu dari daftar menu" },
              qty: { type: "integer", minimum: 1, maximum: 20 },
            },
          },
        },
        fulfillment: { type: "string", enum: ["antar", "ambil"] },
        name: { type: "string", minLength: 1, maxLength: 60, description: "Nama pemesan" },
        address: {
          type: "string",
          maxLength: 200,
          description: "Alamat pengiriman (wajib bila antar)",
        },
      },
    },
  },
};

function err(status: number, message: string) {
  return Response.json({ message }, { status });
}

export async function POST(req: Request) {
  // 1. Parse dan validasi body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(400, MSG_BAD_INPUT);
  }

  const parsed = z
    .object({ messages: z.array(z.any()).min(1) })
    .safeParse(body);
  if (!parsed.success) return err(400, MSG_BAD_INPUT);

  const { messages } = parsed.data;
  const last = messages[messages.length - 1];
  const content = typeof last?.content === "string" ? last.content : "";
  if (!content.trim() || content.length > MAX_MSG_LENGTH) {
    return err(400, MSG_BAD_INPUT);
  }

  // 2. Visitor ID dari cookie
  const jar = await cookies();
  let visitorId = jar.get("visitor_id")?.value;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    jar.set("visitor_id", visitorId, { httpOnly: true, maxAge: 86400 });
  }

  // 3. Cek batas pemakaian
  const cfg = {
    perVisitor: parseInt(process.env.VISITOR_DAILY_LIMIT ?? "15"),
    global: parseInt(process.env.GLOBAL_DAILY_LIMIT ?? "300"),
  };
  const limit = await checkAndConsume(visitorId, upstashStore(), cfg);
  if (!limit.allowed) {
    const message =
      limit.reason === "visitor"
        ? MSG_VISITOR_LIMIT
        : limit.reason === "daily"
          ? MSG_DAILY_LIMIT
          : MSG_BUSY;
    return err(429, message);
  }

  // 4. Stream ke NVIDIA
  try {
    const response = await axios.post(
      NVIDIA_URL,
      {
        model: "nvidia/nemotron-3.5-bolt-e4b",
        messages: [
          { role: "system", content: buildSystemPrompt(MENU) },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
        parallel_tool_calls: true,
        tools: [submitOrderTool],
        tool_choice: "auto",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        responseType: "stream",
      }
    );

    const webReadable = new ReadableStream({
      start(controller) {
        response.data.on("data", (chunk: Buffer) => controller.enqueue(chunk));
        response.data.on("end", () => controller.close());
        response.data.on("error", (e: Error) => controller.error(e));
      },
      cancel() {
        response.data.destroy();
      },
    });

    return new Response(webReadable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return err(429, MSG_BUSY);
  }
}
