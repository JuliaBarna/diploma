"use client";

import { ReactNode } from "react";
import { AuthLogo } from "./AuthLogo";

interface AuthLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftWidth?: number;
}

export function AuthLayout({ left, right, leftWidth = 420 }: AuthLayoutProps) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--c-bg)" }}>
      {/* Left Panel */}
      <div
        className="auth-left-panel"
        style={{
          width: `${leftWidth}px`,
          minWidth: `${leftWidth}px`,
          background: "var(--c-card)",
          display: "flex",
          flexDirection: "column",
          padding: "48px 40px",
          position: "relative",
          zIndex: 1,
          overflowY: "auto",
          borderRight: "1px solid var(--c-border)",
        }}
      >
        <div style={{ marginBottom: "56px" }}>
          <AuthLogo />
        </div>
        {left}
      </div>

      {/* Right Panel */}
      <div
        className="auth-right-panel"
        style={{
          flex: 1,
          background: "var(--c-bg)",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Grid background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage:
            "linear-gradient(var(--c-border) 1px, transparent 1px), linear-gradient(90deg, var(--c-border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }} />

        <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {right}
        </div>

        <div style={{
          position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)",
          color: "var(--c-dim)", fontSize: "12px", whiteSpace: "nowrap",
        }}>
          Система управління енергоресурсами
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
