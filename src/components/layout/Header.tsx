"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useSidebarToggle } from "./DashboardShell";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

function ProfileDropdown() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const name = session?.user?.name ?? "Користувач";
  const email = session?.user?.email ?? "";
  const image = session?.user?.image;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "34px", height: "34px", borderRadius: "50%", border: "none",
          background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: "13px", fontWeight: 600,
          cursor: "pointer", flexShrink: 0, padding: 0, overflow: "hidden",
          boxShadow: open ? "0 0 0 2px #22c55e44" : "none",
          transition: "box-shadow 0.15s",
        }}
        title="Профіль"
      >
        {image ? (
          <Image src={image} alt={name} width={34} height={34} style={{ borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          width: "240px", background: "var(--c-card)",
          border: "1px solid var(--c-border)", borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)", zIndex: 100, overflow: "hidden",
        }}>
          {/* User info */}
          <div style={{ padding: "16px", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: "15px", fontWeight: 700, overflow: "hidden",
            }}>
              {image ? (
                <Image src={image} alt={name} width={42} height={42} style={{ borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                initials
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name}
              </div>
              <div style={{ fontSize: "12px", color: "var(--c-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "2px" }}>
                {email}
              </div>
            </div>
          </div>

          {/* Role badge */}
          {(session?.user as { role?: string })?.role && (
            <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span style={{ fontSize: "12px", color: "var(--c-dim)" }}>
                Роль: <span style={{ color: "#22c55e", fontWeight: 500 }}>{(session?.user as { role?: string }).role === "admin" ? "Адміністратор" : "Користувач"}</span>
              </span>
            </div>
          )}

          {/* Sign out */}
          <div style={{ padding: "8px" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 10px", borderRadius: "8px", background: "transparent",
                border: "none", color: "var(--c-dim)", fontSize: "13px",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444" }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--c-dim)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Вийти з акаунту
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header({ title, subtitle }: HeaderProps) {
  const setSidebarOpen = useSidebarToggle();

  return (
    <header style={{
      height: "64px", background: "var(--c-card)", borderBottom: "1px solid var(--c-border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button className="mobile-only" onClick={() => setSidebarOpen(true)}
          style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", display: "flex", padding: "4px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
            <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
            <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
          </svg>
        </button>
        <div>
          <h1 style={{ color: "var(--c-text)", fontSize: "16px", fontWeight: 600, margin: 0, letterSpacing: "-0.3px" }}>{title}</h1>
          {subtitle && <p style={{ color: "var(--c-dim)", fontSize: "12px", margin: 0, marginTop: "1px" }}>{subtitle}</p>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span className="desktop-only" style={{ color: "var(--c-dim)", fontSize: "13px" }}>
          {new Date().toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}
        </span>
        <div className="desktop-only" style={{ width: "1px", height: "24px", background: "var(--c-border)" }} />
        <ThemeToggle />
        <ProfileDropdown />
      </div>
    </header>
  );
}
