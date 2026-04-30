import { Header } from "@/components/layout/Header"
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard"

export default function AnalyticsPage() {
  return (
    <>
      <Header title="Аналітика" subtitle="Аналіз даних PV-системи за обраний період" />
      <main className="page-main" style={{ flex: 1, padding: "28px" }}>
        <AnalyticsDashboard />
      </main>
    </>
  )
}
