import { Header } from "@/components/layout/Header";

export default function DashboardPage() {
  return (
    <>
      <Header title="Моніторинг" subtitle="Система управління енергоресурсами" />

      <main className="page-main" style={{ flex: 1, padding: "28px" }}>
        {/* Placeholder — буде замінено в четвер */}
        <div
          style={{
            background: "rgba(19,22,31,0.6)",
            border: "1px solid #1e2535",
            borderRadius: "12px",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <polygon
                points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
                fill="white"
              />
            </svg>
          </div>
          <h2
            style={{
              color: "#f1f5f9",
              fontSize: "18px",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Дашборд у розробці
          </h2>
          <p style={{ color: "#475569", fontSize: "14px", marginTop: "8px" }}>
            KPI-картки та графіки будуть додані в четвер
          </p>
        </div>
      </main>
    </>
  );
}
