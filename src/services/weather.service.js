// src/services/weather.service.js

import axios from "axios";
import appConfig from "../config/index.js";
import logger from "../config/logger.js";

const BASE = "https://api.openweathermap.org/data/2.5";

/**
 * Fetch current weather + 6-hour hourly forecast using free OWM 2.5 endpoints.
 * - /weather   → current conditions
 * - /forecast  → 3-hour step forecast (we take the first 2 slots = ~6 hours)
 */
export const getWeatherSnapshot = async (city, countryCode) => {
  if (!city) return null;

  try {
    const q = countryCode ? `${city},${countryCode}` : city;
    const params = { q, units: "metric", appid: appConfig.OPENWEATHER_API_KEY };

    const [currentRes, forecastRes] = await Promise.all([
      axios.get(`${BASE}/weather`, { params }),
      axios.get(`${BASE}/forecast`, { params }),
    ]);

    const current  = currentRes.data;
    // forecast returns 3-hour steps — take first 2 slots (~6 hours ahead)
    const slots    = (forecastRes.data.list || []).slice(0, 2);

    const next6Hours = slots.map((h) => ({
      time:        h.dt_txt,
      temp:        h.main.temp,
      feelsLike:   h.main.feels_like,
      condition:   h.weather?.[0]?.main        ?? "Clear",
      description: h.weather?.[0]?.description ?? "",
      pop:         Math.round((h.pop ?? 0) * 100),
      humidity:    h.main.humidity,
      windSpeed:   h.wind?.speed ?? 0,
    }));

    const allTemps  = [current.main.temp, ...next6Hours.map((h) => h.temp)];
    const allPops   = next6Hours.map((h) => h.pop);
    const willRain  = allPops.some((p) => p > 40);
    const willBeCold = allTemps.some((t) => t < 15);
    const willBeHot  = allTemps.every((t) => t > 28);
    const maxPop     = allPops.length ? Math.max(...allPops) : 0;

    return {
      city,
      countryCode,
      current: {
        temp:        current.main.temp,
        feelsLike:   current.main.feels_like,
        condition:   current.weather?.[0]?.main        ?? "Clear",
        description: current.weather?.[0]?.description ?? "",
        humidity:    current.main.humidity,
        windSpeed:   current.wind?.speed ?? 0,
      },
      next6Hours,
      summary: {
        willRain,
        willBeCold,
        willBeHot,
        maxPrecipitationChance: maxPop,
        label: willRain
          ? "Rain expected — prioritise layering and water-resistant fabrics"
          : willBeCold
          ? "Cool weather — layering recommended"
          : willBeHot
          ? "Hot weather — breathable, lightweight fabrics preferred"
          : "Mild weather — standard layering",
      },
    };
  } catch (err) {
    logger.warn(`[WeatherService] Could not fetch weather for ${city}: ${err.message}`);
    return null;
  }
};
