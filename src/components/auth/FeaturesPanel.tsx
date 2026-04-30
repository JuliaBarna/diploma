const FEATURES = [
  {
    color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)",
    title: "Моніторинг в реальному часі",
    desc: "Відстежуйте споживання енергії щохвилини",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.2)",
    title: "Аналітика та прогнозування",
    desc: "ШІ-алгоритми для оптимізації витрат",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    color: "#a855f7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)",
    title: "Сценарії економії",
    desc: "Автоматичні рекомендації для зниження рахунків",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      </svg>
    ),
  },
  {
    color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)",
    title: "Звіти та експорт",
    desc: "Детальні звіти в форматах PDF та CSV",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

export function FeaturesPanel() {
  return (
    <div style={{ width: "360px" }}>
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ marginBottom: "32px", position: "relative" }}>
        <h2 style={{ color: "var(--c-text)", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.4px", lineHeight: 1.3 }}>
          Все необхідне для{" "}
          <span style={{ color: "#22c55e" }}>керування енергією</span>
        </h2>
        <p style={{ color: "var(--c-dim)", fontSize: "13px", marginTop: "10px", lineHeight: "1.5" }}>
          Інтелектуальна платформа для аналізу та оптимізації енергоспоживання
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
        {FEATURES.map((f) => (
          <div key={f.title} style={{
            background: "rgba(19,22,31,0.8)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(30,37,53,0.8)", borderRadius: "12px",
            padding: "16px", display: "flex", alignItems: "flex-start", gap: "14px",
          }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: f.bg, border: `1px solid ${f.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: f.color, flexShrink: 0,
            }}>
              {f.icon}
            </div>
            <div>
              <div style={{ color: "var(--c-text)", fontSize: "13px", fontWeight: 600, marginBottom: "3px" }}>
                {f.title}
              </div>
              <div style={{ color: "var(--c-dim)", fontSize: "12px", lineHeight: "1.5" }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
