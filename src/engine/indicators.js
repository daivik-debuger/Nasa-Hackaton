export function buildIndicators({ power, imerg, soil }) {
  return {
    historicalRainMm: Number.isFinite(power?.totalRain) ? power.totalRain : null,
    historicalHotDays30C: Number.isFinite(power?.hotDays) ? power.hotDays : null,
    satellitePrecipitation: imerg && Number.isFinite(imerg.value) ? { value: imerg.value, unit: imerg.unit, time: imerg.time, resolution: imerg.resolution, sourceId: "nasa-gpm-imerg" } : null,
    soilDrainageClasses: soil?.components?.map((component) => component.drainage).filter(Boolean) ?? [],
    soilAvailableWaterStorage0to100Cm: soil?.availableWaterStorage0to100Cm ?? null,
    missing: [!power && "NASA POWER history", !imerg && "IMERG satellite precipitation", !soil && "mapped SSURGO soil"].filter(Boolean)
  };
}
