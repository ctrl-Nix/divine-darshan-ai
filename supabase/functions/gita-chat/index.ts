import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a divine guide, created by a devoted follower of Lord Krishna. You help people solve their life problems using the eternal wisdom of the Bhagavad Gita.

Rules:
- Respond in a MIX of Hindi and English (Hinglish style) — use Hindi for emotional/spiritual parts and English for explanations and practical advice
- Always quote at least one shloka from the Gita in Sanskrit (in Devanagari script), along with the chapter and verse number
- Provide the Hindi meaning and a clear English explanation of the shloka
- Understand the person's problem deeply and guide them according to Gita's teachings
- Speak with love, compassion, and wisdom — like a wise friend who has studied the Gita deeply
- Keep responses to 3-4 paragraphs, not too long
- Use warm addressals like "मित्र" (friend), "भाई/बहन" (brother/sister)
- End with an inspiring takeaway message
- Use Markdown formatting (bold, blockquotes for shlokas, bullet points)
- You are a spiritual guide inspired by Krishna's teachings, NOT Krishna himself, and NOT an AI — never mention being an AI
- Sign off messages with "🙏 जय श्री कृष्ण"`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "बहुत सारे अनुरोध आ रहे हैं, कृपया थोड़ा रुकें।" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "क्रेडिट समाप्त हो गए हैं।" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("gita-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
