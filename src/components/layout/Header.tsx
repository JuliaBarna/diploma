"use client";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header
      style={{
        height: "64px",
        background: "#13161f",
        borderBottom: "1px solid #1e2535",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left — page title */}
      <div>
        <h1
          style={{
            color: "#f1f5f9",
            fontSize: "16px",
            fontWeight: 600,
            margin: 0,
            letterSpacing: "-0.3px",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: "#475569", fontSize: "12px", margin: 0, marginTop: "1px" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right — date + user avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Current date */}
        <span style={{ color: "#475569", fontSize: "13px" }}>
          {new Date().toLocaleDateString("uk-UA", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>

        {/* Divider */}
        <div style={{ width: "1px", height: "24px", background: "#1e2535" }} />

        {/* User avatar */}
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          title="Профіль"
        >
          У
        </div>
      </div>
    </header>
  );
}