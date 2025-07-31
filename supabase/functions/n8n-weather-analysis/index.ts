import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { weatherData, location } = await req.json();
    
    console.log('Received weather analysis request for:', location);
    
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ 
          error: 'N8N webhook not configured',
          fallback: true 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepare structured data for LLM analysis
    const analysisPayload = {
      location: {
        city: location.city,
        country: location.country,
        coordinates: `${location.latitude}, ${location.longitude}`
      },
      currentWeather: weatherData[0], // Today's weather
      forecast: weatherData.slice(1), // Future days
      analysisContext: {
        purpose: "RC aircraft flying conditions",
        factors: [
          "wind speed and direction",
          "precipitation and visibility", 
          "temperature effects on battery and electronics",
          "cloud ceiling for visual line of sight",
          "general safety considerations"
        ]
      },
      timestamp: new Date().toISOString()
    };

    console.log('Sending payload to n8n webhook:', analysisPayload);

    // Call n8n webhook
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisPayload),
    });

    if (!response.ok) {
      console.error('n8n webhook failed:', response.status, response.statusText);
      throw new Error(`n8n webhook failed: ${response.status}`);
    }

    const analysisResult = await response.json();
    
    console.log('Received analysis from n8n:', analysisResult);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: analysisResult,
        source: 'n8n-llm',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in n8n-weather-analysis function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: true,
        source: 'error'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});