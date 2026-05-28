export interface EnergyChartPoint {
  time: string
  pvOutput: number
  gridPower: number
  consumption: number
  export: number
}

export interface RevenueChartPoint {
  day: string
  revenue: number
}

export interface RdnChartPoint {
  time: string
  price: number
}

export interface LiveStats {
  pvPower: number
  gridPower: number
  loadPower: number
  yieldToday: number
  supplyFromGrid: number
  exportToday: number
  totalYield: number
  consumptionToday: number
  revenueToday: number
  energyChartData: EnergyChartPoint[]
  monthEnergyData: EnergyChartPoint[]
  revenueChartData: RevenueChartPoint[]
  rdnDayData: RdnChartPoint[]
  rdnMonthData: RdnChartPoint[]
  coalSaved: number
  co2Avoided: number
  treesPlanted: number
  dataDate: string
  hasData: boolean
}
