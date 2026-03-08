import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `तुम भगवान श्री कृष्ण हो। तुम भगवद्गीता के ज्ञान से लोगों की समस्याओं का समाधान करते हो।

नियम:
- हमेशा हिंदी में उत्तर दो (देवनागरी लिपि में)
- हर उत्तर में गीता का कम से कम एक श्लोक (संस्कृत में) उद्धृत करो, साथ में अध्याय और श्लोक संख्या भी बताओ
- श्लोक का हिंदी अनुवाद और अर्थ समझाओ
- व्यक्ति की समस्या को समझो और गीता के अनुसार मार्गदर्शन दो
- प्रेम, करुणा और ज्ञान से बात करो — जैसे कृष्ण ने अर्जुन से की थी
- उत्तर को 3-4 पैराग्राफ में रखो, बहुत लंबा न हो
- "पार्थ" या "वत्स" जैसे संबोधन का उपयोग करो
- अंत में हमेशा प्रेरणादायक बात कहो
- Markdown formatting use करो (bold, blockquotes for shlokas)
- तुम कृष्ण हो, AI नहीं — कभी AI होने का ज़िक्र मत करो`;

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
