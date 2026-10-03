const DEFAULT_FILL_VALUE = -999;

function requireValue(value, label) {
  if (value === "" || value === null || value === undefined) throw new Error(`${label} is required.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a number.`);
  return parsed;
}

export function validateFieldQuery(input, { lastFullYear = new Date().getUTCFullYear() - 1 } = {}) {
  const lat = requireValue(input.latitude, "Latitude");
  const lon = requireValue(input.longitude, "Longitude");
  const start = requireValue(input.startYear, "Start year");
  const end = requireValue(input.endYear, "End year");

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error("Enter a valid latitude (−90 to 90) and longitude (−180 to 180).");
  }
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1981 || end > lastFullYear) {
    throw new Error(`Choose whole years from 1981 through ${lastFullYear}.`);
  }
  if (start > end) throw new Error("The start year must be the same as or earlier than the end year.");
  return { lat, lon, start, end };
}

function seriesValues(series, keys, fillValue) {
  return keys.map((date) => Number(series[date])).filter((value) => Number.isFinite(value) && value !== fillValue);
}

export function summarizePowerPayload(payload, location) {
  const params = payload?.properties?.parameter;
  if (!params?.T2M || !params?.T2M_MAX || !params?.PRECTOTCORR) {
    throw new Error("NASA POWER returned an unexpected response. Please try again later.");
  }

  const keys = Object.keys(params.T2M).sort();
  const fillValue = Number(payload?.header?.fill_value ?? DEFAULT_FILL_VALUE);
  const temp = seriesValues(params.T2M, keys, fillValue);
  const maxTemp = seriesValues(params.T2M_MAX, keys, fillValue);
  const rain = seriesValues(params.PRECTOTCORR, keys, fillValue);
  if (!temp.length || !rain.length) throw new Error("No valid daily climate values were returned for this point and period.");

  const mean = temp.reduce((sum, value) => sum + value, 0) / temp.length;
  const totalRain = rain.reduce((sum, value) => sum + value, 0);
  const hotDays = maxTemp.filter((value) => value >= 30).length;
  const recentGrowingSeasonDays = keys.filter((day) => day.startsWith(String(location.end)) && Number(day.slice(4, 6)) >= 4 && Number(day.slice(4, 6)) <= 9);
  const wettestGrowingSeasonDay = recentGrowingSeasonDays.map((day) => ({ day, value: Number(params.PRECTOTCORR[day]) })).filter(({ value }) => Number.isFinite(value) && value !== fillValue && value >= 0).sort((a, b) => b.value - a.value)[0] ?? null;
  const unitMap = payload?.parameters || {};

  return {
    keys,
    params,
    mean,
    totalRain,
    hotDays,
    temperatureUnit: unitMap.T2M?.units || "°C",
    rainUnit: unitMap.PRECTOTCORR?.units || "mm/day",
    lat: location.lat,
    lon: location.lon,
    start: location.start,
    end: location.end,
    count: temp.length,
    rainfallCount: rain.length,
    wettestGrowingSeasonDay,
    fillValue
  };
}
