const PV_PEAK_KW = 160

function solarCurve(hour: number): number {
  if (hour < 5 || hour > 21) return 0
  const center = 13.0
  const width = 4.5
  return Math.exp(-Math.pow(hour - center, 2) / (2 * width * width))
}

function loadKw(hour: number): number {
  if (hour >= 8 && hour <= 18) return 130 + Math.sin((hour - 13) * 0.4) * 15
  if (hour >= 6 && hour < 8) return 75
  if (hour > 18 && hour <= 22) return 85
  return 50
}

function r3(n: number): number {
  return Math.round(n * 1000) / 1000
}

function dayFactor(date: Date): number {
  return 0.88 + ((date.getDate() * 7 + date.getMonth() * 13) % 20) / 100
}

export function currentPvPower(now: Date): number {
  const hour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
  return Math.max(0, r3(solarCurve(hour) * PV_PEAK_KW * dayFactor(now)))
}

export interface HourlyRecord {
  statisticalPeriod: string
  globalIrradiation: number
  avgTemperature: number
  theoreticalYield: number
  pvYield: number
  inverterYield: number
  export: number
  import: number
  lossExportKwh: number
  lossExportEur: number
  charge: number
  discharge: number
  revenue: number
}

export function generateDayRecords(date: Date): HourlyRecord[] {
  const df = dayFactor(date)
  const month = date.getMonth()

  return Array.from({ length: 24 }, (_, h) => {
    const midHour = h + 0.5
    const pvYield = r3(solarCurve(midHour) * PV_PEAK_KW * df)
    const load = r3(loadKw(h))
    const exportKwh = r3(Math.max(0, pvYield - load))
    const importKwh = r3(Math.max(0, load - pvYield))
    const irr = pvYield > 0 ? r3(pvYield / (PV_PEAK_KW * 0.18)) : 0
    const baseTemp = 5 + (month <= 1 || month >= 10 ? 0 : month <= 5 ? month * 2.5 : (12 - month) * 2.5)
    const temp = r3(baseTemp + (h >= 11 && h <= 16 ? 8 : 2))

    return {
      statisticalPeriod: `${date.toISOString().slice(0, 10)} ${String(h).padStart(2, "0")}:00:00 DST`,
      globalIrradiation: irr,
      avgTemperature: temp,
      theoreticalYield: r3(pvYield * 1.02),
      pvYield,
      inverterYield: r3(pvYield * 0.975),
      export: exportKwh,
      import: importKwh,
      lossExportKwh: 0,
      lossExportEur: 0,
      charge: 0,
      discharge: 0,
      revenue: r3(exportKwh * 0.12),
    }
  })
}

export interface EnergyChartPoint {
  time: string
  pvOutput: number
  gridPower: number
  consumption: number
}

export interface RevenueChartPoint {
  day: string
  revenue: number
}

export interface LiveStats {
  pvPower: number
  gridPower: number
  loadPower: number
  yieldToday: number
  supplyFromGrid: number
  totalYield: number
  revenueToday: number
  energyChartData: EnergyChartPoint[]
  monthEnergyData: EnergyChartPoint[]
  revenueChartData: RevenueChartPoint[]
  coalSaved: number
  co2Avoided: number
  treesPlanted: number
}

export function generateLiveStats(now: Date): LiveStats {
  const pvPower = currentPvPower(now)
  const loadPower = r3(loadKw(now.getHours()))
  const gridPower = r3(pvPower - loadPower)

  const todayRecords = generateDayRecords(now)
  const h = now.getHours()
  const minFrac = now.getMinutes() / 60

  let yieldToday = 0
  let supplyFromGrid = 0
  let revenueToday = 0
  for (let i = 0; i < h; i++) {
    yieldToday += todayRecords[i].pvYield
    supplyFromGrid += todayRecords[i].import
    revenueToday += todayRecords[i].revenue
  }
  yieldToday = r3(yieldToday + pvPower * minFrac)
  supplyFromGrid = r3(supplyFromGrid + Math.max(0, loadPower - pvPower) * minFrac)
  revenueToday = r3(revenueToday + Math.max(0, pvPower - loadPower) * 0.12 * minFrac)

  const energyChartData: EnergyChartPoint[] = todayRecords.slice(0, h + 1).map((rec, i) => ({
    time: `${String(i).padStart(2, "0")}:00`,
    pvOutput: rec.pvYield,
    gridPower: rec.import,
    consumption: -(rec.pvYield + rec.import - rec.export),
  }))

  const monthEnergyData: EnergyChartPoint[] = []
  for (let d = 1; d <= now.getDate(); d++) {
    const dayDate = new Date(now.getFullYear(), now.getMonth(), d)
    const recs = generateDayRecords(dayDate)
    const pvSum = r3(recs.reduce((s, r) => s + r.pvYield, 0))
    const impSum = r3(recs.reduce((s, r) => s + r.import, 0))
    const expSum = r3(recs.reduce((s, r) => s + r.export, 0))
    monthEnergyData.push({
      time: String(d).padStart(2, "0"),
      pvOutput: pvSum,
      gridPower: impSum,
      consumption: -(pvSum + impSum - expSum),
    })
  }

  const revenueChartData: RevenueChartPoint[] = monthEnergyData.map((_, idx) => {
    const dayDate = new Date(now.getFullYear(), now.getMonth(), idx + 1)
    const recs = generateDayRecords(dayDate)
    return {
      day: String(idx + 1).padStart(2, "0"),
      revenue: r3(recs.reduce((s, r) => s + r.revenue, 0)),
    }
  })

  const totalYield = r3(202.61 + yieldToday / 1000)

  return {
    pvPower,
    gridPower,
    loadPower,
    yieldToday,
    supplyFromGrid,
    totalYield,
    revenueToday,
    energyChartData,
    monthEnergyData,
    revenueChartData,
    coalSaved: r3(totalYield * 0.4),
    co2Avoided: r3(totalYield * 0.475),
    treesPlanted: Math.round(totalYield * 0.65),
  }
}
