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

    // Pick speaker based on language
    const speaker = language_code === "en-IN" ? "maya" : "anushka";

    const ttsResponse = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: [normalizedText],
        target_language_code: language_code,
        model: "bulbul:v2",
        speaker,
        pace: 0.85,
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

    let parsed: { audios?: string[] } | null = null;
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      parsed = null;
    }

    const audioContent = parsed?.audios?.[0];
    if (!audioContent) {
      return new Response(JSON.stringify({ error: "No audio returned from TTS provider" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ audio: audioContent }), {
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
