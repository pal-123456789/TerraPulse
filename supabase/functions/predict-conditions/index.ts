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
    const { latitude, longitude, weatherData, historicalData } = await req.json();

    console.log("Running prediction analysis...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const predictionPrompt = `Based on the current and historical environmental data, predict conditions for the next 24-48 hours:

Current Conditions:
- Location: ${latitude}, ${longitude}
- Temperature: ${weatherData.temperature}°C
- Humidity: ${weatherData.humidity}%
- Pressure: ${weatherData.pressure} hPa
- Wind Speed: ${weatherData.wind_speed} m/s

Analyze trends and provide predictions in this exact JSON format:
{
  "riskLevel": "low" | "medium" | "high" | "extreme",
  "predictionType": string,
  "confidence": number (0-100),
  "forecast": string,
  "expectedConditions": {
    "temperature": string,
    "precipitation": string,
    "wind": string
  },
  "warnings": string[]
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
            content: "You are an expert meteorologist and environmental forecaster. Analyze patterns and make predictions based on available data. Respond only with valid JSON.",
          },
          { role: "user", content: predictionPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const predictionText = aiData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = predictionText.match(/\{[\s\S]*\}/);
    const prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      riskLevel: "low",
      predictionType: "general_forecast",
      confidence: 70,
      forecast: "Normal conditions expected",
      expectedConditions: {
        temperature: "Stable",
        precipitation: "Low chance",
        wind: "Calm"
      },
      warnings: []
    };

    // Store prediction in database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + 48);

    await supabaseClient.from("predictions").insert({
      latitude: latitude,
      longitude: longitude,
      prediction_type: prediction.predictionType,
      risk_level: prediction.riskLevel,
      confidence: prediction.confidence,
      forecast_data: prediction,
      valid_until: validUntil.toISOString(),
    });

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in predict-conditions:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
