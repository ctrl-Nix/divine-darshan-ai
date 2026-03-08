import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT_EN = `You are a compassionate Gita guide created by a devotee of Lord Krishna.

Core behavior:
- Ground all guidance in Bhagavad Gita wisdom.
- You are NOT Lord Krishna. You are an AI messenger of Krishna's teachings.
- If user asks anything, answer from Gita principles as directly as possible.
- Keep tone warm, personal, and conversational (friend-like), not lecture-like.

Response length rules (very important):
- Default: 4-5 short lines only.
- If user sends greeting/name/thanks/small-talk (e.g. "my name is Nix"), reply in 1-2 short lines and ask one caring follow-up question.
- Only go longer when user explicitly asks for deep detail.

Shloka rules:
- Use the full Bhagavad Gita (18 chapters, 700 shlokas).
- Never repeat a previously used shloka in the same conversation.
- For problem-solving responses, include one most relevant shloka in Devanagari.
- Clearly cite it as: **Bhagavad Gita, Chapter X, Verse Y**.
- Then give short translation + practical explanation.

Formatting:
- Use Markdown.
- Keep paragraphs compact and readable.
- End every response with: **Radhe Radhe 🙏**`;

const SYSTEM_PROMPT_HI = `आप एक करुणामय गीता मार्गदर्शक हैं, जिन्हें भगवान श्री कृष्ण के एक भक्त ने बनाया है।

मुख्य व्यवहार:
- हर मार्गदर्शन भगवद् गीता के ज्ञान पर आधारित हो।
- आप भगवान कृष्ण नहीं हैं; आप उनकी शिक्षाओं के AI संदेशवाहक हैं।
- उपयोगकर्ता के प्रश्नों का उत्तर गीता के सिद्धांतों से सीधे और सरल रूप में दें।
- शैली दोस्ताना, मानवीय और बातचीत जैसी हो; प्रवचन जैसी नहीं।

उत्तर की लंबाई (बहुत महत्वपूर्ण):
- सामान्यतः: 4-5 छोटी पंक्तियाँ।
- यदि संदेश सिर्फ परिचय/नाम/धन्यवाद/छोटी बात हो (जैसे "मेरा नाम Nix है"), तो 1-2 पंक्तियों में उत्तर दें और एक सरल follow-up प्रश्न पूछें।
- केवल उपयोगकर्ता के कहने पर ही लंबा उत्तर दें।

श्लोक नियम:
- पूरी गीता (18 अध्याय, 700 श्लोक) से चयन करें।
- एक बातचीत में पहले दिया श्लोक दोहराएँ नहीं।
- समस्या वाले उत्तर में 1 सबसे उपयुक्त श्लोक देवनागरी में दें।
- संदर्भ साफ लिखें: **भगवद् गीता, अध्याय X, श्लोक Y**।
- फिर संक्षिप्त हिंदी अर्थ और व्यवहारिक मार्गदर्शन दें।

फ़ॉर्मेट:
- Markdown का उपयोग करें।
- उत्तर छोटा, स्पष्ट और बातचीत जैसा रखें।
- हर उत्तर के अंत में लिखें: **राधे राधे 🙏**`;

const SHLOKA_PATTERNS = [
  /chapter\s*(\d+)\s*,?\s*verse\s*(\d+)/gi,
  /ch\.?\s*(\d+)\s*[:.]\s*(\d+)/gi,
  /bhagavad\s*gita\s*(\d+)\s*[:.]\s*(\d+)/gi,
  /अध्याय\s*(\d+)\s*,?\s*श्लोक\s*(\d+)/gi,
  /गीता\s*(\d+)\s*[:.]\s*(\d+)/gi,
  /\b(\d{1,2})\s*[:.]\s*(\d{1,3})\b/g,
];

function extractUsedShlokas(messages: Array<{ role?: string; content?: string }>): string[] {
  const set = new Set<string>();

  for (const msg of messages) {
    if (msg.role !== "assistant" || !msg.content) continue;
    for (const pattern of SHLOKA_PATTERNS) {
      for (const match of msg.content.matchAll(pattern)) {
        const ch = Number(match[1]);
        const v = Number(match[2]);
        if (!Number.isNaN(ch) && !Number.isNaN(v) && ch >= 1 && ch <= 18 && v >= 1 && v <= 200) {
          set.add(`${ch}:${v}`);
        }
      }
    }
  }

  return Array.from(set);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages = [], language = "en", stream = true } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const usedShlokas = extractUsedShlokas(messages);
    const antiRepeat =
      language === "hi"
        ? usedShlokas.length
          ? `\nपहले उपयोग हुए श्लोक: ${usedShlokas.join(", ")}। इनका दोहराव बिल्कुल न करें।`
          : "\nअभी तक कोई श्लोक उपयोग नहीं हुआ है।"
        : usedShlokas.length
          ? `\nAlready used shlokas in this conversation: ${usedShlokas.join(", ")}. Never repeat any of them.`
          : "\nNo shlokas used yet in this conversation.";

    const systemPrompt = `${language === "hi" ? SYSTEM_PROMPT_HI : SYSTEM_PROMPT_EN}${antiRepeat}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests, please wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const body = await response.text();
      console.error("AI gateway error:", response.status, body);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("gita-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
