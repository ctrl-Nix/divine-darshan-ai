import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SARVAM_API_KEY = Deno.env.get("SARVAM_API_KEY");
    if (!SARVAM_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Sarvam AI is not configured yet. Please add your API key." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { audio, language_code } = await req.json();
    if (!audio) {
      return new Response(
        JSON.stringify({ error: "No audio provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 to binary
    const binaryAudio = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0));
    const blob = new Blob([binaryAudio], { type: "audio/webm" });

    const formData = new FormData();
    formData.append("file", blob, "audio.webm");
    formData.append("model", "saaras:v3");
    formData.append("language_code", language_code || "hi-IN");
    formData.append("with_timestamps", "false");

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Sarvam API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "Speech-to-text failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ text: result.transcript || "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sarvam-stt error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
