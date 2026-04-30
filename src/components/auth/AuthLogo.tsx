export function AuthLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{
        width: "36px", height: "36px", borderRadius: "10px",
        background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </div>
      <span style={{ color: "var(--c-text)", fontWeight: 700, fontSize: "16px", letterSpacing: "-0.3px" }}>
        EMS <span style={{ color: "#22c55e" }}>Система</span>
      </span>
    </div>
  );
}
