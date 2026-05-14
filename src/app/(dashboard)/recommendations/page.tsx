import { Header } from "@/components/layout/Header"

export default function RecommendationsPage() {
  return (
    <>
      <Header title="Рекомендації" subtitle="Аналіз та поради щодо оптимізації" />
      <main className="page-main" style={{ flex: 1, padding: "28px" }}>
        <div style={{ color: "var(--c-dim)", fontSize: "14px" }}>Розділ у розробці</div>
      </main>
    </>
  )
}
