import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text, language_code } = await req.json();
    const speaker = language_code === "en-IN" ? "vidya" : "manisha";

    const rawText = typeof text === "string" ? text : "";
    const normalizedText = rawText.replace(/\s+/g, " ").trim();
    if (!normalizedText) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MAX_INPUT_CHARS = 450;
    const inputs: string[] = [];
    let cursor = 0;

    while (cursor < normalizedText.length) {
      let end = Math.min(cursor + MAX_INPUT_CHARS, normalizedText.length);

      if (end < normalizedText.length) {
        const window = normalizedText.slice(cursor, end);
        const splitAt = Math.max(window.lastIndexOf(". "), window.lastIndexOf("? "), window.lastIndexOf("! "), window.lastIndexOf(" "));
        if (splitAt > 120) end = cursor + splitAt + 1;
      }

      const chunk = normalizedText.slice(cursor, end).trim();
      if (chunk) inputs.push(chunk);
      cursor = end;
    }

    const apiKey = Deno.env.get("SARVAM_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "SARVAM_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        inputs,
        target_language_code: language_code ?? "hi-IN",
        speaker,
        model: "bulbul:v2",
        pace: 0.8,
        enable_preprocessing: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Sarvam TTS error:", res.status, errText);
      throw new Error(`Sarvam TTS error: ${res.status}`);
    }

    const json = await res.json();

    return new Response(JSON.stringify({
      audio: json.audios?.[0] ?? null,
      audios: Array.isArray(json.audios) ? json.audios : [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sarvam-tts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
