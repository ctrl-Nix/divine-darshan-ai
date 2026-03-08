import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
    if (!SARVAM_API_KEY) {
      return new Response(JSON.stringify({ error: "SARVAM_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text, language_code = "hi-IN" } = await req.json();
    const normalizedText = typeof text === "string" ? text.trim() : "";

    if (!normalizedText) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Always use hi-IN for TTS — even English text with Sanskrit words
    // sounds better with Hindi pronunciation rules
    const ttsLang = language_code === "en-IN" ? "en-IN" : "hi-IN";

    const ttsResponse = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: normalizedText,
        target_language_code: ttsLang,
        model: "bulbul:v3",
        speaker: "advait",
        pace: 0.85,
        temperature: 0.4,
        speech_sample_rate: 24000,
        enable_preprocessing: true,
      }),
    });

    const bodyText = await ttsResponse.text();
    if (!ttsResponse.ok) {
      console.error("sarvam-tts api error:", ttsResponse.status, bodyText);
      return new Response(JSON.stringify({ error: "TTS provider error", details: bodyText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: { audios?: string[]; audio?: string } | null = null;
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      parsed = null;
    }

    const audioChunks = Array.isArray(parsed?.audios)
      ? parsed.audios.filter((chunk): chunk is string => typeof chunk === "string" && chunk.length > 0)
      : typeof parsed?.audio === "string" && parsed.audio.length > 0
        ? [parsed.audio]
        : [];

    if (!audioChunks.length) {
      return new Response(JSON.stringify({ error: "No audio returned from TTS provider" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ audios: audioChunks, mimeType: "audio/wav" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("sarvam-tts error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
