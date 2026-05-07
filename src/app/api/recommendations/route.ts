import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export type RecommendationType = "success" | "warning" | "info" | "danger"

export interface Recommendation {
  id: string
  type: RecommendationType
  title: string
  description: string
  metric?: string
  action?: string
}

export async function GET() {
  const since = new Date()
  since.setDate(since.getDate() - 30)
  since.setHours(0, 0, 0, 0)

  const records = await prisma.inverterRecord.findMany({
    where: { timestamp: { gte: since } },
    select: {
      timestamp: true,
      pvYield: true,
      inverterYield: true,
      theoreticalYield: true,
      export: true,
      import: true,
      revenue: true,
    },
    orderBy: { timestamp: "asc" },
  })

  if (records.length === 0) {
    return NextResponse.json([{
      id: "no-data",
      type: "info",
      title: "Недостатньо даних",
      description: "Завантажте дані інвертора для отримання рекомендацій.",
      action: "Перейдіть до розділу «Дані» та імпортуйте файли",
    }])
  }

  // ── Aggregations ────────────────────────────────────────────────────────────

  const totalPv       = records.reduce((s, r) => s + r.pvYield, 0)
  const totalInverter = records.reduce((s, r) => s + r.inverterYield, 0)
  const totalExport   = records.reduce((s, r) => s + r.export, 0)
  const totalImport   = records.reduce((s, r) => s + r.import, 0)
  const totalRevenue  = records.reduce((s, r) => s + r.revenue, 0)

  const efficiency = totalPv > 0 ? (totalInverter / totalPv) * 100 : 0
  const exportRatio = totalPv > 0 ? (totalExport / totalPv) * 100 : 0
  const importRatio = totalPv > 0 ? (totalImport / totalPv) * 100 : 0

  // Average PV by hour
  const hourMap = new Map<number, { sum: number; count: number }>()
  for (const r of records) {
    const h = r.timestamp.getUTCHours()
    if (!hourMap.has(h)) hourMap.set(h, { sum: 0, count: 0 })
    const e = hourMap.get(h)!
    e.sum += r.pvYield
    e.count++
  }
  const hourlyAvg = Array.from({ length: 24 }, (_, h) => {
    const e = hourMap.get(h)
    return { hour: h, avg: e ? e.sum / e.count : 0 }
  })
  const peakHours = [...hourlyAvg]
    .sort((a, b) => b.avg - a.avg)
    .filter(h => h.avg > 0)
    .slice(0, 3)
    .sort((a, b) => a.hour - b.hour)
  const peakLabel = peakHours.map(h => `${String(h.hour).padStart(2, "0")}:00`).join(", ")

  // Daily production for consistency
  const byDate = new Map<string, number>()
  for (const r of records) {
    const d = r.timestamp.toISOString().slice(0, 10)
    byDate.set(d, (byDate.get(d) ?? 0) + r.pvYield)
  }
  const dailyValues = Array.from(byDate.values())
  const avgDaily = dailyValues.reduce((s, v) => s + v, 0) / dailyValues.length
  const stdDev = Math.sqrt(dailyValues.reduce((s, v) => s + (v - avgDaily) ** 2, 0) / dailyValues.length)
  const cv = avgDaily > 0 ? (stdDev / avgDaily) * 100 : 0

  // Potential revenue gain if export reduced by 20%
  const revenuePerKwh = totalExport > 0 ? totalRevenue / (totalPv - totalImport + 0.001) : 0
  const potentialGain = totalExport * 0.2 * revenuePerKwh

  // ── Build recommendations ────────────────────────────────────────────────────

  const recs: Recommendation[] = []

  // 1. Inverter efficiency
  if (efficiency < 80) {
    recs.push({
      id: "efficiency-danger",
      type: "danger",
      title: "Критично низька ефективність інвертора",
      description: `Ефективність інвертора складає лише ${efficiency.toFixed(1)}%, що значно нижче норми (>90%). Це може свідчити про несправність або забруднення панелей.`,
      metric: `${efficiency.toFixed(1)}%`,
      action: "Перевірте стан сонячних панелей та інвертора, зверніться до сервісного центру",
    })
  } else if (efficiency < 90) {
    recs.push({
      id: "efficiency-warning",
      type: "warning",
      title: "Знижена ефективність інвертора",
      description: `Ефективність інвертора ${efficiency.toFixed(1)}% — трохи нижче оптимального рівня (>90%). Можливе часткове затінення або забруднення панелей.`,
      metric: `${efficiency.toFixed(1)}%`,
      action: "Рекомендується очистити сонячні панелі та перевірити кріплення",
    })
  } else {
    recs.push({
      id: "efficiency-good",
      type: "success",
      title: "Ефективність інвертора в нормі",
      description: `Інвертор працює з ефективністю ${efficiency.toFixed(1)}% — відмінний показник. Система функціонує оптимально.`,
      metric: `${efficiency.toFixed(1)}%`,
    })
  }

  // 2. Self-consumption (export ratio)
  if (exportRatio > 60) {
    recs.push({
      id: "export-high",
      type: "warning",
      title: "Висока частка експорту енергії",
      description: `Ви експортуєте ${exportRatio.toFixed(0)}% виробленої енергії в мережу. Перенесення споживання на пікові години вироблення дозволить заощадити на рахунках за електрику.`,
      metric: `${exportRatio.toFixed(0)}% експорт`,
      action: "Вмикайте побутові прилади (пральна машина, посудомийка, зарядка авто) в проміжку з 09:00 до 15:00",
    })
  } else if (exportRatio < 20) {
    recs.push({
      id: "export-low",
      type: "info",
      title: "Високе власне споживання",
      description: `Частка експорту лише ${exportRatio.toFixed(0)}% — ви ефективно використовуєте вироблену енергію. Розгляньте можливість накопичення надлишків у батарею.`,
      metric: `${exportRatio.toFixed(0)}% експорт`,
    })
  }

  // 3. Grid import dependency
  if (importRatio > 40) {
    recs.push({
      id: "import-high",
      type: "warning",
      title: "Висока залежність від мережі",
      description: `Імпорт з мережі складає ${importRatio.toFixed(0)}% від виробленої PV-енергії. Більша частина імпорту припадає на вечірні та нічні години.`,
      metric: `${importRatio.toFixed(0)}% від PV`,
      action: "Розгляньте встановлення системи накопичення енергії (батареї) для покриття нічного споживання",
    })
  }

  // 4. Peak production hours
  if (peakHours.length > 0) {
    recs.push({
      id: "peak-hours",
      type: "info",
      title: "Оптимальні години для споживання",
      description: `Пікове вироблення PV зафіксовано о ${peakLabel}. У ці години вироблення є максимальним — найкращий час для роботи енергоємних приладів.`,
      metric: `${peakHours[0] ? `${peakHours[0].avg.toFixed(2)} кВт·год/год` : ""}`,
      action: `Плануйте роботу побутових приладів на ${peakLabel}`,
    })
  }

  // 5. Production variability
  if (cv > 60) {
    recs.push({
      id: "variability-high",
      type: "info",
      title: "Нестабільне вироблення через погоду",
      description: `Коефіцієнт варіації добового вироблення складає ${cv.toFixed(0)}% — висока залежність від погодних умов. Хмарні дні суттєво знижують продуктивність.`,
      metric: `CV ${cv.toFixed(0)}%`,
      action: "Розгляньте встановлення системи прогнозування вироблення для кращого планування споживання",
    })
  }

  // 6. Revenue potential
  if (potentialGain > 1) {
    recs.push({
      id: "revenue-potential",
      type: "info",
      title: "Потенційне збільшення доходу",
      description: `Перенесення 20% поточного експорту на власне споживання може принести додатковий дохід близько ${potentialGain.toFixed(2)} ₪ за місяць за рахунок скорочення рахунків за імпорт.`,
      metric: `+${potentialGain.toFixed(2)} ₪/міс`,
      action: "Оптимізуйте графік споживання відповідно до пікових годин вироблення",
    })
  }

  // 7. Overall summary
  recs.push({
    id: "summary",
    type: "success",
    title: "Підсумок за 30 днів",
    description: `Система виробила ${totalPv.toFixed(1)} кВт·год енергії та принесла дохід ${totalRevenue.toFixed(2)} ₪. Середнє добове вироблення: ${avgDaily.toFixed(1)} кВт·год.`,
    metric: `${totalRevenue.toFixed(2)} ₪`,
  })

  return NextResponse.json(recs)
}
