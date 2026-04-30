import { Header } from "@/components/layout/Header"
import { RecommendationsDashboard } from "@/components/recommendations/RecommendationsDashboard"

export default function RecommendationsPage() {
  return (
    <>
      <Header title="Рекомендації" subtitle="Аналіз системи та поради з оптимізації" />
      <main className="page-main" style={{ flex: 1, padding: "28px" }}>
        <RecommendationsDashboard />
      </main>
    </>
  )
}
