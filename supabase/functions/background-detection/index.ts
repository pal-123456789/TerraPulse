import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type WeatherReading = {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  wind_speed?: number;
};

type AnomalyAnalysis = {
  hasAnomaly: boolean;
  severity: "low" | "medium" | "high" | "extreme";
  anomalyType: string;
  description: string;
  recommendation: string;
};

const detectCriticalConditions = (reading: WeatherReading): AnomalyAnalysis | null => {
  const temperature = Number(reading.temperature);
  const humidity = Number(reading.humidity);
  const pressure = Number(reading.pressure);
  const windSpeed = Number(reading.wind_speed);

  if (Number.isFinite(windSpeed) && windSpeed >= 32) {
    return {
      hasAnomaly: true,
      severity: "extreme",
      anomalyType: "Extreme Wind",
      description: `Dangerous sustained wind speed of ${windSpeed.toFixed(1)} m/s detected.`,
      recommendation: "Shelter indoors, avoid windows, and follow local emergency guidance.",
    };
  }
  if (Number.isFinite(windSpeed) && windSpeed >= 20) {
    return {
      hasAnomaly: true,
      severity: "high",
      anomalyType: "Severe Wind",
      description: `Severe wind speed of ${windSpeed.toFixed(1)} m/s detected.`,
      recommendation: "Secure loose objects and avoid exposed outdoor areas.",
    };
  }
  if (Number.isFinite(temperature) && temperature >= 44) {
    return {
      hasAnomaly: true,
      severity: "extreme",
      anomalyType: "Extreme Heat",
      description: `Extreme temperature of ${temperature.toFixed(1)}°C detected.`,
      recommendation: "Avoid outdoor activity, hydrate frequently, and seek a cooled environment.",
    };
  }
  if (Number.isFinite(temperature) && temperature >= 40) {
    return {
      hasAnomaly: true,
      severity: "high",
      anomalyType: "Heat Stress",
      description: `Dangerously high temperature of ${temperature.toFixed(1)}°C detected.`,
      recommendation: "Limit outdoor exposure, hydrate, and monitor for heat illness.",
    };
  }
  if (Number.isFinite(temperature) && temperature <= -20) {
    return {
      hasAnomaly: true,
      severity: temperature <= -30 ? "extreme" : "high",
      anomalyType: "Extreme Cold",
      description: `Dangerously low temperature of ${temperature.toFixed(1)}°C detected.`,
      recommendation: "Remain indoors where possible and protect exposed skin.",
    };
  }
  if (Number.isFinite(pressure) && pressure <= 970) {
    return {
      hasAnomaly: true,
      severity: "high",
      anomalyType: "Severe Pressure Drop",
      description: `Very low atmospheric pressure of ${pressure.toFixed(0)} hPa detected.`,
      recommendation: "Monitor official storm warnings and prepare for rapidly changing weather.",
    };
  }
  if (Number.isFinite(temperature) && Number.isFinite(humidity) && temperature >= 36 && humidity >= 60) {
    return {
      hasAnomaly: true,
      severity: "high",
      anomalyType: "Humid Heat Stress",
      description: `Dangerous combined heat and humidity detected (${temperature.toFixed(1)}°C, ${humidity.toFixed(0)}% humidity).`,
      recommendation: "Reduce exertion, hydrate, and move to a cooled environment.",
    };
  }
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Require a shared cron secret — this function does bulk AI calls and can
  // send real emails to every user, so it must only be triggered by the
  // Supabase scheduler / trusted callers, not by anonymous internet traffic.
  const CRON_SECRET = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || provided !== CRON_SECRET) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }


  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Scan every configured monitored location. Email preferences must not
    // disable anomaly detection or in-app notifications.
    const { data: preferences, error: prefError } = await supabase
      .from("notification_preferences")
      .select("*");

    if (prefError) {
      console.error("Error fetching preferences:", prefError);
      throw prefError;
    }

    if (!preferences || preferences.length === 0) {
      console.log("No monitored users configured");
      return new Response(JSON.stringify({ message: "No users to notify", scanned: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${preferences.length} monitored users`);

    let emailsSent = 0;
    let anomaliesFound = 0;
    let usersWithData = 0;
    let weatherFailures = 0;
    let aiFailures = 0;
    let emailFailures = 0;
    let skippedDuplicates = 0;

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
          .gte("created_at", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
          .order("created_at", { ascending: false })
          .limit(1);

        let weatherData: WeatherReading | null = envData?.[0] ?? null;

        // No fresh stored reading — pull live conditions from OpenWeather so the
        // scan analyses real data instead of a static placeholder (which never
        // produced an anomaly, so alerts never fired).
        if (!weatherData) {
          const owKey = Deno.env.get("OPENWEATHER_API_KEY");
          if (owKey) {
            try {
              const wRes = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${owKey}&units=metric`,
              );
              if (wRes.ok) {
                const w = await wRes.json();
                weatherData = {
                  temperature: w.main?.temp,
                  humidity: w.main?.humidity,
                  pressure: w.main?.pressure,
                  wind_speed: w.wind?.speed,
                };
                await supabase.from("environmental_data").insert({
                  latitude: lat,
                  longitude: lon,
                  temperature: w.main?.temp,
                  humidity: w.main?.humidity,
                  pressure: w.main?.pressure,
                  wind_speed: w.wind?.speed,
                  data_source: "openweather_background_scan",
                });
              } else {
                weatherFailures++;
                const providerError = await wRes.text();
                console.error(`OpenWeather error ${wRes.status} for user ${pref.user_id}: ${providerError.slice(0, 300)}`);
              }
            } catch (wErr) {
              weatherFailures++;
              console.error("OpenWeather fetch failed:", wErr);
            }
          } else {
            weatherFailures++;
            console.error("OPENWEATHER_API_KEY is not configured");
          }
        }

        if (!weatherData) {
          console.log(`No environmental data available for user ${pref.user_id}, skipping`);
          continue;
        }

        usersWithData++;

        // Deterministic safety thresholds ensure critical conditions still trigger
        // when the AI provider is unavailable or returns malformed output.
        let analysis = detectCriticalConditions(weatherData);
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

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const text = aiData.choices?.[0]?.message?.content ?? "";
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const aiAnalysis = JSON.parse(jsonMatch[0]) as AnomalyAnalysis;
              if (!analysis || aiAnalysis.hasAnomaly) analysis = aiAnalysis;
            } catch (parseError) {
              aiFailures++;
              console.error(`AI response parse failed for user ${pref.user_id}:`, parseError);
            }
          } else {
            aiFailures++;
            console.error(`AI response contained no JSON for user ${pref.user_id}`);
          }
        } else {
          aiFailures++;
          const aiError = await aiResponse.text();
          console.error(`AI error ${aiResponse.status} for user ${pref.user_id}: ${aiError.slice(0, 300)}`);
        }

        if (!analysis?.hasAnomaly) continue;

        // Check severity threshold
        const severityOrder = ["low", "medium", "high", "extreme"];
        const minSeverityIdx = severityOrder.indexOf(pref.min_severity || "medium");
        const detectedIdx = severityOrder.indexOf(analysis.severity);

        if (detectedIdx < minSeverityIdx) continue;

        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(pref.user_id);
        const userEmail = pref.notification_email || userData?.user?.email;

        // Avoid repeatedly emailing the same user about the same condition,
        // without suppressing the anomaly record or in-app notification.
        let suppressEmail = false;
        const duplicateWindow = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
        if (pref.email_notifications_enabled && userEmail) {
          const { data: recentAlert } = await supabase
            .from("email_alert_logs")
            .select("id")
            .eq("user_id", pref.user_id)
            .eq("anomaly_type", analysis.anomalyType)
            .eq("status", "sent")
            .gte("created_at", duplicateWindow)
            .limit(1)
            .maybeSingle();
          if (recentAlert) {
            suppressEmail = true;
            skippedDuplicates++;
            console.log(`Duplicate ${analysis.anomalyType} email suppressed for user ${pref.user_id}`);
          }
        }

        anomaliesFound++;

        // Store anomaly
        const { error: anomalyError } = await supabase.from("anomalies").insert({
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
        if (anomalyError) {
          console.error(`Failed to store anomaly for user ${pref.user_id}:`, anomalyError.message);
        }

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
        if (!pref.email_notifications_enabled || !userEmail || suppressEmail) continue;

        const sendEmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-anomaly-email`, {
          method: "POST",
          headers: {
            apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            "x-internal-secret": Deno.env.get("CRON_SECRET") ?? "",
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
        } else {
          emailFailures++;
          const emailError = await sendEmailResponse.text();
          console.error(`Email failed ${sendEmailResponse.status} for user ${pref.user_id}: ${emailError.slice(0, 500)}`);
        }
      } catch (userError) {
        console.error(`Error processing user ${pref.user_id}:`, userError);
      }
    }

    console.log(`Background scan complete: ${anomaliesFound} anomalies, ${emailsSent} emails sent, ${weatherFailures} weather failures, ${aiFailures} AI failures, ${emailFailures} email failures`);

    return new Response(
      JSON.stringify({
        success: true,
        usersScanned: preferences.length,
        usersWithData,
        anomaliesFound,
        emailsSent,
        skippedDuplicates,
        failures: {
          weather: weatherFailures,
          ai: aiFailures,
          email: emailFailures,
        },
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
