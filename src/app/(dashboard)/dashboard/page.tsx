import { Header } from "@/components/layout/Header"
import { MonitoringDashboard } from "@/components/monitoring/MonitoringDashboard"

export default function DashboardPage() {
  return (
    <>
      <Header title="Моніторинг" subtitle="Система управління енергоресурсами" />
      <main className="page-main" style={{ flex: 1, padding: "28px" }}>
        <MonitoringDashboard />
      </main>
    </>
  )
}
