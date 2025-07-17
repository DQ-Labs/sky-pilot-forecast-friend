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
    const { endpoint, params } = await req.json();
    const apiKey = Deno.env.get('WEATHERAPI_KEY');

    if (!apiKey) {
      throw new Error('Weather API key not configured');
    }

    // Build the WeatherAPI URL
    const baseUrl = 'https://api.weatherapi.com/v1';
    const url = new URL(`${baseUrl}/${endpoint}`);
    url.searchParams.append('key', apiKey);
    
    // Add all provided parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    console.log('Fetching weather data from:', url.toString().replace(apiKey, '[REDACTED]'));

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('WeatherAPI error:', response.status, errorText);
      throw new Error(`Weather API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in weather-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});