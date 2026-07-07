import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ==========================================
    // AUTHENTICATION CHECK
    // ==========================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);
    
    if (authError || !claimsData?.claims) {
      console.error("Auth validation failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    // ==========================================
    // RATE LIMITING CHECK
    // ==========================================
    const { data: rateLimitResult } = await supabaseClient.rpc("check_rate_limit", {
      p_user_id: userId,
      p_endpoint: "fetch-environmental-data",
      p_max_requests: 20,
      p_window_minutes: 60
    });

    if (rateLimitResult?.exceeded) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Try again later.", 
          remaining: rateLimitResult.remaining,
          limit: rateLimitResult.limit 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const { latitude, longitude } = await req.json();

    if (latitude === undefined || longitude === undefined) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude must be numbers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new Response(
        JSON.stringify({ error: "Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching environmental data for lat: ${latitude}, lon: ${longitude}`);

    // ==========================================
    // API CALLS
    // ==========================================
    const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
    const NASA_API_KEY = Deno.env.get("NASA_API_KEY");

    if (!OPENWEATHER_API_KEY || !NASA_API_KEY) {
      console.error("API keys not configured");
      throw new Error("API keys not configured");
    }

    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );

    if (!weatherResponse.ok) {
      console.error("Weather API error:", await weatherResponse.text());
      throw new Error("Failed to fetch weather data");
    }

    const weatherData = await weatherResponse.json();

    const nasaResponse = await fetch(
      `https://api.nasa.gov/planetary/earth/imagery?lon=${longitude}&lat=${latitude}&dim=0.1&api_key=${NASA_API_KEY}`
    );

    let nasaData = null;
    if (nasaResponse.ok) {
      nasaData = await nasaResponse.json();
    } else {
      console.warn("NASA API error:", await nasaResponse.text());
    }

    // ==========================================
    // STORE DATA (using service role for writes)
    // ==========================================
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: insertError } = await serviceClient
      .from("environmental_data")
      .insert({
        latitude: latitude,
        longitude: longitude,
        temperature: weatherData.main?.temp,
        humidity: weatherData.main?.humidity,
        pressure: weatherData.main?.pressure,
        wind_speed: weatherData.wind?.speed,
        weather_condition: weatherData.weather?.[0]?.description,
        data_source: "openweather_nasa",
      });

    if (insertError) {
      console.error("Database insert error:", insertError);
    }

    console.log(`Successfully fetched data for user ${userId}`);

    return new Response(
      JSON.stringify({
        weather: weatherData,
        nasa: nasaData,
        stored: !insertError,
        rateLimit: {
          remaining: rateLimitResult?.remaining ?? "unknown",
          limit: rateLimitResult?.limit ?? 20
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-environmental-data:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
