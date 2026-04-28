"use client";

import { ReactNode } from "react";
import { AuthLogo } from "./AuthLogo";

interface AuthLayoutProps {
  /** Вміст лівої панелі (під логотипом) */
  left: ReactNode;
  /** Вміст правої панелі */
  right: ReactNode;
  /** Ширина лівої панелі (default 420px) */
  leftWidth?: number;
}

export function AuthLayout({ left, right, leftWidth = 420 }: AuthLayoutProps) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0b0e14" }}>
      {/* ─── Left Panel ─────────────────────────────────────────── */}
      <div
        className="auth-left-panel"
        style={{
          width: `${leftWidth}px`,
          minWidth: `${leftWidth}px`,
          background: "#13161f",
          display: "flex",
          flexDirection: "column",
          padding: "48px 40px",
          position: "relative",
          zIndex: 1,
          overflowY: "auto",
        }}
      >
        <div style={{ marginBottom: "56px" }}>
          <AuthLogo />
        </div>
        {left}
      </div>

      {/* ─── Right Panel ────────────────────────────────────────── */}
      <div
        className="auth-right-panel"
        style={{
          flex: 1,
          background: "#0b0e14",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(30,37,53,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(30,37,53,0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Content above grid */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {right}
        </div>

        {/* Bottom version label */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#334155",
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
        >
          Система управління енергоресурсами 
        </div>
      </div>

      {/* Global spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
