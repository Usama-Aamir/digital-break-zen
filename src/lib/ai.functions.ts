import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ALLOWED_MODELS = ["google/gemini-3-flash-preview", "google/gemini-2.5-flash"] as const;

const Input = z.object({
  system: z.string().min(1).max(2000),
  user: z.string().min(1).max(4000),
  model: z.enum(ALLOWED_MODELS).optional(),
});

/** Generic single-shot text completion via Lovable AI Gateway. */
export const generateText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: data.model ?? "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: data.system },
          { role: "user", content: data.user },
        ],
      }),
    });

    if (!res.ok) {
      // Consume body for logging but never expose raw gateway details to clients.
      const body = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("Rate limit hit — try again in a moment.");
      if (res.status === 402)
        throw new Error("AI credits exhausted. Add credits in workspace billing.");
      console.error(`[ai-gateway] ${res.status}: ${body.slice(0, 300)}`);
      throw new Error("AI service is temporarily unavailable. Please try again later.");
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    return { text };
  });
