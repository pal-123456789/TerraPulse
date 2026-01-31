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
    const { latitude, longitude, weatherData, historicalData, satelliteData, airQualityData } = await req.json();

    console.log("Running enhanced anomaly detection with multi-source data...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare comprehensive AI analysis prompt with multiple data sources
    const analysisPrompt = `You are an expert environmental scientist with access to multiple real-time data sources. Analyze the following comprehensive environmental data and detect anomalies with high precision.

## LOCATION DATA
- Coordinates: ${latitude}°, ${longitude}°
- Region Type: ${getRegionType(latitude, longitude)}

## CURRENT WEATHER CONDITIONS
- Temperature: ${weatherData?.temperature ?? 'N/A'}°C
- Humidity: ${weatherData?.humidity ?? 'N/A'}%
- Atmospheric Pressure: ${weatherData?.pressure ?? 'N/A'} hPa
- Wind Speed: ${weatherData?.wind_speed ?? 'N/A'} m/s
- Wind Direction: ${weatherData?.wind_direction ?? 'N/A'}°
- Cloud Cover: ${weatherData?.cloud_cover ?? 'N/A'}%
- Visibility: ${weatherData?.visibility ?? 'N/A'} km
- Weather Condition: ${weatherData?.weather_condition ?? 'N/A'}
- UV Index: ${weatherData?.uv_index ?? 'N/A'}

## HISTORICAL COMPARISON (Past 30 days average)
- Avg Temperature: ${historicalData?.avg_temperature ?? 'N/A'}°C
- Avg Humidity: ${historicalData?.avg_humidity ?? 'N/A'}%
- Avg Pressure: ${historicalData?.avg_pressure ?? 'N/A'} hPa
- Temperature Deviation: ${historicalData?.temp_deviation ?? 'N/A'}°C
- Precipitation Total: ${historicalData?.precipitation ?? 'N/A'} mm

## AIR QUALITY DATA
- AQI: ${airQualityData?.aqi ?? 'N/A'}
- PM2.5: ${airQualityData?.pm25 ?? 'N/A'} µg/m³
- PM10: ${airQualityData?.pm10 ?? 'N/A'} µg/m³
- Ozone: ${airQualityData?.ozone ?? 'N/A'} ppb
- NO2: ${airQualityData?.no2 ?? 'N/A'} ppb
- CO: ${airQualityData?.co ?? 'N/A'} ppm

## SATELLITE OBSERVATIONS
- Land Surface Temperature: ${satelliteData?.surface_temp ?? 'N/A'}°C
- Vegetation Index (NDVI): ${satelliteData?.ndvi ?? 'N/A'}
- Fire Detection: ${satelliteData?.fire_detected ?? 'N/A'}
- Soil Moisture: ${satelliteData?.soil_moisture ?? 'N/A'}%
- Snow Cover: ${satelliteData?.snow_cover ?? 'N/A'}%

## ANALYSIS REQUIREMENTS
1. Compare current conditions against historical baselines
2. Identify any statistically significant deviations (>2 standard deviations)
3. Cross-reference multiple data sources for validation
4. Consider seasonal patterns and regional climate norms
5. Assess potential cascading environmental effects

Provide your detailed analysis in this exact JSON format:
{
  "hasAnomaly": boolean,
  "severity": "low" | "medium" | "high" | "extreme",
  "anomalyType": string (e.g., "temperature_spike", "pressure_drop", "air_quality_hazard", "drought_indicator"),
  "confidence": number (0-100, based on data quality and cross-validation),
  "description": string (detailed scientific explanation),
  "affectedRadius": number (estimated affected area in km),
  "potentialCauses": string[] (list of likely causes),
  "recommendation": string (actionable advice),
  "riskFactors": {
    "immediateRisk": boolean,
    "healthImpact": "none" | "low" | "moderate" | "high" | "severe",
    "environmentalImpact": "none" | "low" | "moderate" | "high" | "severe",
    "economicImpact": "none" | "low" | "moderate" | "high" | "severe"
  },
  "relatedIndicators": string[] (other environmental indicators to monitor),
  "forecastTrend": "improving" | "stable" | "worsening" | "uncertain"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert environmental scientist and climate analyst with expertise in:
- Meteorology and atmospheric science
- Climate pattern analysis
- Environmental risk assessment
- Satellite data interpretation
- Air quality monitoring
- Geospatial analysis

Your analyses are used for critical environmental monitoring. Be precise, scientific, and actionable. Always respond with valid JSON only.`,
          },
          { role: "user", content: analysisPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent, precise outputs
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
      confidence: 50,
      description: "Unable to parse analysis",
      recommendation: "Manual review recommended"
    };

    // If anomaly detected with high confidence, store in database
    if (analysis.hasAnomaly && analysis.confidence >= 60) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseClient.from("anomalies").insert({
        name: formatAnomalyName(analysis.anomalyType),
        description: analysis.description,
        latitude: latitude,
        longitude: longitude,
        anomaly_type: analysis.anomalyType,
        severity: analysis.severity,
        status: analysis.riskFactors?.immediateRisk ? 'active' : 'monitoring',
        metadata: { 
          recommendation: analysis.recommendation,
          confidence: analysis.confidence,
          affectedRadius: analysis.affectedRadius,
          potentialCauses: analysis.potentialCauses,
          riskFactors: analysis.riskFactors,
          relatedIndicators: analysis.relatedIndicators,
          forecastTrend: analysis.forecastTrend,
          dataQuality: {
            weather: !!weatherData,
            historical: !!historicalData,
            satellite: !!satelliteData,
            airQuality: !!airQualityData
          }
        },
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

// Helper function to determine region type
function getRegionType(lat: number, lon: number): string {
  const absLat = Math.abs(lat);
  
  if (absLat > 66.5) return "Polar";
  if (absLat > 55) return "Subarctic/Subantarctic";
  if (absLat > 35) return "Temperate";
  if (absLat > 23.5) return "Subtropical";
  return "Tropical";
}

// Helper function to format anomaly names
function formatAnomalyName(type: string): string {
  const nameMap: Record<string, string> = {
    temperature_spike: "Temperature Anomaly Alert",
    pressure_drop: "Atmospheric Pressure Warning",
    air_quality_hazard: "Air Quality Hazard",
    drought_indicator: "Drought Conditions",
    flood_risk: "Flooding Risk",
    storm_formation: "Storm Formation Detected",
    wildfire_risk: "Wildfire Risk Alert",
    seismic_activity: "Seismic Activity Warning",
    volcanic_activity: "Volcanic Activity Alert",
    ocean_temperature: "Ocean Temperature Anomaly",
    magnetic_disturbance: "Geomagnetic Disturbance",
  };
  
  return nameMap[type] || type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
