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
    const apiKey = Deno.env.get('CHECKWX_API_KEY');

    if (!apiKey) {
      throw new Error('CheckWX API key not configured');
    }

    // Build the CheckWX URL
    const baseUrl = 'https://api.checkwx.com';
    const url = new URL(`${baseUrl}/${endpoint}`);
    
    // Add all provided parameters
    Object.entries(params || {}).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    console.log('Fetching CheckWX data from:', url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('CheckWX API error:', response.status, errorText);
      throw new Error(`CheckWX API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in checkwx-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});