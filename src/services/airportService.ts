import { supabase } from "@/integrations/supabase/client";

export interface Airport {
  icao: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number;
  distance?: number;
}

export interface MetarData {
  icao: string;
  observed: string;
  raw_text: string;
  temperature: {
    celsius: number;
    fahrenheit: number;
  };
  dewpoint: {
    celsius: number;
    fahrenheit: number;
  };
  humidity_percent: number;
  barometer: {
    hg: number;
    hpa: number;
  };
  wind: {
    degrees: number;
    speed_kts: number;
    speed_mph: number;
    gust_kts?: number;
    gust_mph?: number;
  };
  visibility: {
    miles: string;
    meters: string;
  };
  clouds: Array<{
    code: string;
    text: string;
    feet: number;
    meters: number;
  }>;
  flight_category: string;
  conditions: Array<{
    code: string;
    text: string;
  }>;
}

// Major airports with good METAR coverage in the US
const MAJOR_AIRPORTS: Airport[] = [
  { icao: "KATL", name: "Hartsfield-Jackson Atlanta International", city: "Atlanta", country: "US", latitude: 33.6407, longitude: -84.4277, elevation: 1026 },
  { icao: "KLAX", name: "Los Angeles International", city: "Los Angeles", country: "US", latitude: 34.0522, longitude: -118.2437, elevation: 125 },
  { icao: "KORD", name: "O'Hare International", city: "Chicago", country: "US", latitude: 41.9786, longitude: -87.9048, elevation: 672 },
  { icao: "KDFW", name: "Dallas/Fort Worth International", city: "Dallas", country: "US", latitude: 32.8968, longitude: -97.0380, elevation: 607 },
  { icao: "KDEN", name: "Denver International", city: "Denver", country: "US", latitude: 39.8617, longitude: -104.6731, elevation: 5433 },
  { icao: "KJFK", name: "John F. Kennedy International", city: "New York", country: "US", latitude: 40.6413, longitude: -73.7781, elevation: 13 },
  { icao: "KSFO", name: "San Francisco International", city: "San Francisco", country: "US", latitude: 37.6213, longitude: -122.3790, elevation: 13 },
  { icao: "KLAS", name: "McCarran International", city: "Las Vegas", country: "US", latitude: 36.0840, longitude: -115.1537, elevation: 2181 },
  { icao: "KSEA", name: "Seattle-Tacoma International", city: "Seattle", country: "US", latitude: 47.4502, longitude: -122.3088, elevation: 131 },
  { icao: "KMIA", name: "Miami International", city: "Miami", country: "US", latitude: 25.7959, longitude: -80.2870, elevation: 8 },
  { icao: "KMCO", name: "Orlando International", city: "Orlando", country: "US", latitude: 28.4312, longitude: -81.3081, elevation: 96 },
  { icao: "KPHX", name: "Phoenix Sky Harbor International", city: "Phoenix", country: "US", latitude: 33.4484, longitude: -112.0740, elevation: 1135 },
  { icao: "KBOS", name: "Logan International", city: "Boston", country: "US", latitude: 42.3656, longitude: -71.0096, elevation: 19 },
  { icao: "KMSN", name: "Dane County Regional", city: "Madison", country: "US", latitude: 43.1399, longitude: -89.3375, elevation: 887 },
  { icao: "KBNA", name: "Nashville International", city: "Nashville", country: "US", latitude: 36.1245, longitude: -86.6782, elevation: 599 },
];

const callCheckWXAPI = async (endpoint: string, params: Record<string, any> = {}) => {
  const { data, error } = await supabase.functions.invoke('checkwx-api', {
    body: { endpoint, params }
  });

  if (error) throw error;
  return data;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const findNearbyAirports = (latitude: number, longitude: number, maxDistance: number = 100): Airport[] => {
  return MAJOR_AIRPORTS
    .map(airport => ({
      ...airport,
      distance: calculateDistance(latitude, longitude, airport.latitude, airport.longitude)
    }))
    .filter(airport => airport.distance! <= maxDistance)
    .sort((a, b) => a.distance! - b.distance!)
    .slice(0, 5); // Return top 5 closest airports
};

export const getMetarData = async (icaoCode: string): Promise<MetarData | null> => {
  try {
    const response = await callCheckWXAPI(`metar/${icaoCode}/decoded`);
    
    if (response && response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching METAR data:', error);
    return null;
  }
};

export const getMultipleMetarData = async (icaoCodes: string[]): Promise<Record<string, MetarData | null>> => {
  const promises = icaoCodes.map(async (icao) => {
    const data = await getMetarData(icao);
    return [icao, data] as const;
  });
  
  const results = await Promise.all(promises);
  return Object.fromEntries(results);
};