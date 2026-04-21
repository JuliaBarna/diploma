export function AuthLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="white" />
        </svg>
      </div>
      <span
        style={{
          color: "#f1f5f9",
          fontWeight: 700,
          fontSize: "16px",
          letterSpacing: "-0.3px",
        }}
      >
        EMS <span style={{ color: "#3b82f6" }}>Система</span>
      </span>
    </div>
  );
}
