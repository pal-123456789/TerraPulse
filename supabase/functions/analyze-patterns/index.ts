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
      p_endpoint: "analyze-patterns",
      p_max_requests: 15,
      p_window_minutes: 60
    });

    if (rateLimitResult?.exceeded) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Try again later.", 
          remaining: rateLimitResult.remaining 
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // INPUT VALIDATION
    // ==========================================
    const { data, analysisType } = await req.json();
    
    if (!data || !analysisType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: data and analysisType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validAnalysisTypes = ["anomaly", "prediction", "report", "general"];
    if (!validAnalysisTypes.includes(analysisType)) {
      return new Response(
        JSON.stringify({ error: `Invalid analysisType. Must be one of: ${validAnalysisTypes.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit data size to prevent abuse
    const dataStr = JSON.stringify(data);
    if (dataStr.length > 50000) {
      return new Response(
        JSON.stringify({ error: "Data payload too large. Maximum 50KB allowed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Running ${analysisType} analysis for user ${userId}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    switch (analysisType) {
      case "anomaly":
        systemPrompt = "You are an environmental data analyst. Analyze anomaly data and provide insights on patterns, severity trends, and recommendations.";
        break;
      case "prediction":
        systemPrompt = "You are a climate prediction specialist. Analyze environmental data and provide forecasts and risk assessments.";
        break;
      case "report":
        systemPrompt = "You are an environmental report analyst. Analyze user-submitted reports, identify patterns, and provide expert commentary.";
        break;
      default:
        systemPrompt = "You are an environmental data expert. Provide detailed analysis of the provided data.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this environmental data:\n\n${dataStr.slice(0, 10000)}` }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const result = await response.json();
    const analysis = result.choices[0].message.content;

    console.log(`Analysis completed for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        metadata: {
          dataPoints: Array.isArray(data) ? data.length : 1,
          analysisType,
          timestamp: new Date().toISOString()
        },
        rateLimit: {
          remaining: rateLimitResult?.remaining ?? "unknown",
          limit: rateLimitResult?.limit ?? 15
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-patterns function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
