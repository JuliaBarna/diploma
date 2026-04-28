"use client";

import { useSidebarToggle } from "./DashboardShell";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const setSidebarOpen = useSidebarToggle();

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
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          className="mobile-only"
          onClick={() => setSidebarOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            display: "flex",
            padding: "4px",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
            <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
            <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
          </svg>
        </button>
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
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span className="desktop-only" style={{ color: "#475569", fontSize: "13px" }}>
          {new Date().toLocaleDateString("uk-UA", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>

        <div className="desktop-only" style={{ width: "1px", height: "24px", background: "#1e2535" }} />

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
            flexShrink: 0,
          }}
          title="Профіль"
        >
          У
        </div>
      </div>
    </header>
  );
}
