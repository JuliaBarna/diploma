const BAR_HEIGHTS = [65, 80, 45, 90, 70, 55, 75];
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

const KPI_ITEMS = [
  { label: "Споживання", value: "2847", unit: "кВт·год", color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.15)" },
  { label: "Вартість",   value: "₴6420", unit: "за місяць", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.15)" },
  { label: "Ефект.",     value: "87%",  unit: "рейтинг",   color: "#a855f7", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.15)" },
];

const TAGS = [
  { label: "Споживання", color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.2)"  },
  { label: "Генерація",  color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.2)" },
  { label: "Аналітика",  color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.2)" },
  { label: "Сценарії",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.2)" },
];

export function DashboardPreviewCard() {
  return (
    <>
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative",
        background: "rgba(19,22,31,0.88)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(30,37,53,0.8)",
        borderRadius: "16px",
        padding: "28px",
        width: "340px",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
      }}>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ color: "var(--c-muted)", fontSize: "12px", marginBottom: "4px" }}>Енергетична система</div>
          <div style={{ color: "var(--c-text)", fontSize: "16px", fontWeight: 600 }}>Огляд споживання</div>
        </div>

        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          {KPI_ITEMS.map((k) => (
            <div key={k.label} style={{
              flex: 1, background: k.bg, border: `1px solid ${k.border}`,
              borderRadius: "10px", padding: "14px 12px",
            }}>
              <div style={{ color: k.color, fontSize: "11px", marginBottom: "6px", fontWeight: 500 }}>{k.label}</div>
              <div style={{ color: "var(--c-text)", fontSize: "20px", fontWeight: 700, lineHeight: 1 }}>{k.value}</div>
              <div style={{ color: "var(--c-dim)", fontSize: "10px", marginTop: "2px" }}>{k.unit}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ color: "var(--c-dim)", fontSize: "11px", marginBottom: "10px" }}>Тижневий графік</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "60px" }}>
            {BAR_HEIGHTS.map((h, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div style={{
                  width: "100%", height: `${h}%`,
                  background: i === 3
                    ? "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)"
                    : "rgba(34,197,94,0.2)",
                  borderRadius: "3px 3px 0 0",
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", marginTop: "6px" }}>
            {DAYS.map((d) => (
              <div key={d} style={{ flex: 1, textAlign: "center", color: "var(--c-dim)", fontSize: "10px" }}>{d}</div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {TAGS.map((t) => (
            <span key={t.label} style={{
              padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 500,
              background: t.bg, color: t.color, border: `1px solid ${t.border}`,
            }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
