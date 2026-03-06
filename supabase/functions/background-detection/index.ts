import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all users with email notifications enabled
    const { data: preferences, error: prefError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("email_notifications_enabled", true);

    if (prefError) {
      console.error("Error fetching preferences:", prefError);
      throw prefError;
    }

    if (!preferences || preferences.length === 0) {
      console.log("No users with email notifications enabled");
      return new Response(JSON.stringify({ message: "No users to notify", scanned: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${preferences.length} users with email notifications`);

    let emailsSent = 0;
    let anomaliesFound = 0;

    for (const pref of preferences) {
      try {
        // Use user's monitored location or default global scan points
        const lat = pref.monitored_latitude ?? 0;
        const lon = pref.monitored_longitude ?? 0;

        // Fetch latest environmental data near this location
        const { data: envData } = await supabase
          .from("environmental_data")
          .select("*")
          .gte("latitude", lat - 5)
          .lte("latitude", lat + 5)
          .gte("longitude", lon - 5)
          .lte("longitude", lon + 5)
          .order("created_at", { ascending: false })
          .limit(1);

        const weatherData = envData?.[0] ?? {
          temperature: 22,
          humidity: 60,
          pressure: 1013,
          wind_speed: 5,
        };

        // Run AI anomaly detection
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: "You are an environmental anomaly detector. Analyze data and respond with JSON only.",
              },
              {
                role: "user",
                content: `Analyze environmental conditions at (${lat}, ${lon}):
Temperature: ${weatherData.temperature}°C, Humidity: ${weatherData.humidity}%, 
Pressure: ${weatherData.pressure} hPa, Wind: ${weatherData.wind_speed} m/s.
Respond JSON: {"hasAnomaly":bool,"severity":"low|medium|high|extreme","anomalyType":string,"description":string,"recommendation":string}`,
              },
            ],
            temperature: 0.2,
            max_tokens: 500,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI error for user ${pref.user_id}:`, aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const text = aiData.choices[0].message.content;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;

        const analysis = JSON.parse(jsonMatch[0]);

        if (!analysis.hasAnomaly) continue;

        // Check severity threshold
        const severityOrder = ["low", "medium", "high", "extreme"];
        const minSeverityIdx = severityOrder.indexOf(pref.min_severity || "medium");
        const detectedIdx = severityOrder.indexOf(analysis.severity);

        if (detectedIdx < minSeverityIdx) continue;

        anomaliesFound++;

        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(pref.user_id);
        const userEmail = pref.notification_email || userData?.user?.email;

        if (!userEmail) continue;

        // Store anomaly
        await supabase.from("anomalies").insert({
          name: analysis.anomalyType || "Environmental Anomaly",
          description: analysis.description,
          latitude: lat,
          longitude: lon,
          anomaly_type: analysis.anomalyType || "unknown",
          severity: analysis.severity,
          status: "active",
          metadata: {
            recommendation: analysis.recommendation,
            detectedBy: "background-scan",
            userId: pref.user_id,
          },
        });

        // Create in-app notification
        const { error: notifError } = await supabase.from("notifications").insert({
          user_id: pref.user_id,
          title: `⚠️ ${analysis.anomalyType || "Environmental Anomaly"} Detected`,
          message: analysis.description || `A ${analysis.severity} severity anomaly detected near your monitored location.`,
          type: "anomaly",
        });
        if (notifError) {
          console.error(`Failed to insert notification for user ${pref.user_id}:`, JSON.stringify(notifError));
        } else {
          console.log(`In-app notification created for user ${pref.user_id}`);
        }

        // Send email notification
        const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-anomaly-email`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: userEmail,
            subject: `⚠️ TerraGuardians Alert: ${analysis.anomalyType || "Anomaly"} Detected`,
            anomalyName: analysis.anomalyType,
            anomalyType: analysis.anomalyType,
            severity: analysis.severity,
            description: analysis.description,
            latitude: lat,
            longitude: lon,
            recommendation: analysis.recommendation,
            userId: pref.user_id,
          }),
        });

        if (sendEmailResponse.ok) {
          emailsSent++;
          console.log(`Email sent to ${userEmail} for anomaly: ${analysis.anomalyType}`);
        }
      } catch (userError) {
        console.error(`Error processing user ${pref.user_id}:`, userError);
      }
    }

    console.log(`Background scan complete: ${anomaliesFound} anomalies, ${emailsSent} emails sent`);

    return new Response(
      JSON.stringify({
        success: true,
        usersScanned: preferences.length,
        anomaliesFound,
        emailsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Background detection error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
