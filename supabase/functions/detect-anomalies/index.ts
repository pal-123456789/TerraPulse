import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, weatherData } = await req.json();

    console.log("Running anomaly detection...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare AI analysis prompt
    const analysisPrompt = `Analyze the following environmental data and detect any anomalies or unusual patterns:

Location: ${latitude}, ${longitude}
Temperature: ${weatherData.temperature}°C
Humidity: ${weatherData.humidity}%
Pressure: ${weatherData.pressure} hPa
Wind Speed: ${weatherData.wind_speed} m/s
Condition: ${weatherData.weather_condition}

Provide your analysis in this exact JSON format:
{
  "hasAnomaly": boolean,
  "severity": "low" | "medium" | "high" | "extreme",
  "anomalyType": string,
  "description": string,
  "recommendation": string
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert environmental scientist analyzing weather and climate data for anomaly detection. Respond only with valid JSON.",
          },
          { role: "user", content: analysisPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      hasAnomaly: false,
      severity: "low",
      anomalyType: "none",
      description: "No anomalies detected",
      recommendation: "Normal conditions"
    };

    // If anomaly detected, store in database
    if (analysis.hasAnomaly) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseClient.from("anomalies").insert({
        name: analysis.anomalyType,
        description: analysis.description,
        latitude: latitude,
        longitude: longitude,
        anomaly_type: analysis.anomalyType,
        severity: analysis.severity,
        metadata: { recommendation: analysis.recommendation },
      });
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in detect-anomalies:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
