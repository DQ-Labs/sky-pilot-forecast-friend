import { MetarData } from "./airportService";

export interface ParsedMetarConditions {
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  windCondition: 'good' | 'caution' | 'poor';
  visibilityCondition: 'good' | 'caution' | 'poor';
  cloudCondition: 'good' | 'caution' | 'poor';
  overallCondition: 'good' | 'caution' | 'poor';
  rcFlightRecommendation: string;
  aviationSummary: string;
}

export const parseMetarForRCFlying = (metar: MetarData): ParsedMetarConditions => {
  // Determine wind condition
  const windSpeed = metar.wind.speed_kts;
  const hasGusts = metar.wind.gust_kts !== undefined;
  const gustSpeed = metar.wind.gust_kts || 0;
  
  let windCondition: 'good' | 'caution' | 'poor' = 'good';
  if (windSpeed > 25 || gustSpeed > 30) {
    windCondition = 'poor';
  } else if (windSpeed > 15 || gustSpeed > 20 || hasGusts) {
    windCondition = 'caution';
  }

  // Determine visibility condition
  const visibilityMiles = parseFloat(metar.visibility.miles);
  let visibilityCondition: 'good' | 'caution' | 'poor' = 'good';
  if (visibilityMiles < 3) {
    visibilityCondition = 'poor';
  } else if (visibilityMiles < 6) {
    visibilityCondition = 'caution';
  }

  // Determine cloud condition (lowest cloud base)
  let cloudCondition: 'good' | 'caution' | 'poor' = 'good';
  let lowestCloudBase = Infinity;
  
  metar.clouds.forEach(cloud => {
    if (cloud.code !== 'CLR' && cloud.code !== 'SKC') {
      lowestCloudBase = Math.min(lowestCloudBase, cloud.feet);
    }
  });

  if (lowestCloudBase < 1000) {
    cloudCondition = 'poor';
  } else if (lowestCloudBase < 2500) {
    cloudCondition = 'caution';
  }

  // Overall condition based on worst individual condition
  const conditions = [windCondition, visibilityCondition, cloudCondition];
  let overallCondition: 'good' | 'caution' | 'poor' = 'good';
  if (conditions.includes('poor')) {
    overallCondition = 'poor';
  } else if (conditions.includes('caution')) {
    overallCondition = 'caution';
  }

  // Generate RC flying recommendation
  let rcFlightRecommendation = '';
  if (overallCondition === 'good') {
    rcFlightRecommendation = 'Excellent conditions for RC flying. Good visibility and manageable winds.';
  } else if (overallCondition === 'caution') {
    const issues = [];
    if (windCondition !== 'good') issues.push('gusty winds');
    if (visibilityCondition !== 'good') issues.push('reduced visibility');
    if (cloudCondition !== 'good') issues.push('low clouds');
    rcFlightRecommendation = `Flyable but use caution due to ${issues.join(', ')}. Consider staying close and flying conservatively.`;
  } else {
    rcFlightRecommendation = 'Poor conditions for RC flying. Consider waiting for better weather.';
  }

  // Generate aviation summary
  const aviationSummary = `${metar.flight_category} conditions. Wind: ${windSpeed}${hasGusts ? `G${gustSpeed}` : ''} kts, Visibility: ${metar.visibility.miles} mi, Clouds: ${metar.clouds.map(c => `${c.code} ${c.feet}ft`).join(', ') || 'Clear'}`;

  return {
    flightCategory: metar.flight_category as 'VFR' | 'MVFR' | 'IFR' | 'LIFR',
    windCondition,
    visibilityCondition,
    cloudCondition,
    overallCondition,
    rcFlightRecommendation,
    aviationSummary
  };
};

export const formatMetarTime = (observed: string): string => {
  const date = new Date(observed);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleString();
  }
};