/**
 * WEATHER SERVICE — fetches today's conditions for shoe recommendations.
 * Uses Open-Meteo (free, no API key, no signup).
 * Location from expo-location (already granted for GPS tracking).
 */

import { getCurrentCoordinate } from './locationService';

export interface TodaysWeather {
  temperature: number;      // celsius
  feelsLike: number;
  humidity: number;         // 0-100
  windSpeed: number;        // km/h
  precipitation: number;    // mm
  precipProbability: number; // 0-100
  isRaining: boolean;
  isSnowing: boolean;
  isHot: boolean;           // > 28°C
  isCold: boolean;          // < 5°C
  isWindy: boolean;         // > 25 km/h
  condition: 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'hot' | 'cold';
  summary: string;          // human-readable
}

const CACHE_KEY = 'stride_weather_cache_v1';
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

let _cache: { data: TodaysWeather; timestamp: number } | null = null;

/**
 * Get today's weather. Uses GPS location + Open-Meteo.
 * Returns null if location unavailable or API fails.
 * Caches for 3 hours.
 */
export async function getTodaysWeather(): Promise<TodaysWeather | null> {
  // Check cache
  if (_cache && Date.now() - _cache.timestamp < CACHE_TTL) {
    return _cache.data;
  }

  try {
    const coord = await getCurrentCoordinate();
    if (!coord) return null;

    const url = `https://api.open-meteo.com/v1/forecast`
      + `?latitude=${coord.lat}&longitude=${coord.lng}`
      + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,snowfall,wind_speed_10m,weather_code`
      + `&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const current = data.current;

    const temp = current.temperature_2m ?? 20;
    const feelsLike = current.apparent_temperature ?? temp;
    const humidity = current.relative_humidity_2m ?? 50;
    const windSpeed = current.wind_speed_10m ?? 0;
    const precipitation = current.precipitation ?? 0;
    const rain = current.rain ?? 0;
    const snowfall = current.snowfall ?? 0;
    const weatherCode = current.weather_code ?? 0;

    const isRaining = rain > 0 || (weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82);
    const isSnowing = snowfall > 0 || (weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86);
    const isHot = temp > 28;
    const isCold = temp < 5;
    const isWindy = windSpeed > 25;

    let condition: TodaysWeather['condition'] = 'clear';
    if (isSnowing) condition = 'snow';
    else if (isRaining && windSpeed > 30) condition = 'storm';
    else if (isRaining) condition = 'rain';
    else if (isHot) condition = 'hot';
    else if (isCold) condition = 'cold';
    else if (weatherCode >= 2 && weatherCode <= 3) condition = 'cloudy';

    // Precipitation probability from hourly (not in current, estimate from rain amount)
    const precipProbability = isRaining ? 90 : isSnowing ? 85 : precipitation > 0 ? 60 : 10;

    let summary = '';
    if (isRaining) summary = `Rain, ${Math.round(temp)}°C. Grip and stability matter today.`;
    else if (isSnowing) summary = `Snow, ${Math.round(temp)}°C. Traction is critical.`;
    else if (isHot) summary = `Hot, ${Math.round(temp)}°C. Go light and breathable.`;
    else if (isCold) summary = `Cold, ${Math.round(temp)}°C. Cushion absorbs impact better in cold.`;
    else if (isWindy) summary = `Windy, ${Math.round(windSpeed)} km/h. Stable shoe recommended.`;
    else summary = `${Math.round(temp)}°C, good conditions. Any shoe works.`;

    const weather: TodaysWeather = {
      temperature: temp,
      feelsLike,
      humidity,
      windSpeed,
      precipitation,
      precipProbability,
      isRaining,
      isSnowing,
      isHot,
      isCold,
      isWindy,
      condition,
      summary,
    };

    _cache = { data: weather, timestamp: Date.now() };
    return weather;
  } catch {
    return null;
  }
}
