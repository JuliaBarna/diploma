"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV_ITEMS = [
  {
    href: "/dashboard", label: "Моніторинг",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  },
  {
    href: "/data", label: "Дані",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>,
  },
  {
    href: "/analytics", label: "Аналітика",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    href: "/recommendations", label: "Рекомендації",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" strokeLinecap="round" /></svg>,
  },
];

interface SidebarProps { onClose?: () => void }

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside style={{ width: "220px", minWidth: "220px", background: "var(--c-card)", borderRight: "1px solid var(--c-border)", display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--c-border)", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "38px", height: "38px", borderRadius: "10px", flexShrink: 0,
          background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.2, color: "var(--c-text)" }}>
            EMS <span style={{ color: "#22c55e" }}>Система</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--c-dim)", marginTop: "2px" }}>
            Енергоменеджмент
          </div>
        </div>

        <button className="mobile-only" onClick={onClose}
          style={{ background: "none", border: "none", color: "var(--c-dim)", cursor: "pointer", display: "flex", padding: "4px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" /></svg>
        </button>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px",
              borderRadius: "8px", textDecoration: "none",
              color: isActive ? "var(--c-text)" : "var(--c-dim)",
              background: isActive ? "rgba(34,197,94,0.10)" : "transparent",
              fontSize: "14px", fontWeight: isActive ? 500 : 400, transition: "all 0.15s",
              borderLeft: isActive ? "2px solid #22c55e" : "2px solid transparent",
            }}>
              <span style={{ color: isActive ? "#22c55e" : "var(--c-dim)", display: "flex" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "16px 12px", borderTop: "1px solid var(--c-border)" }}>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", background: "transparent", border: "none", color: "var(--c-dim)", fontSize: "14px", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--c-dim)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          Вийти
        </button>
      </div>
    </aside>
  );
}
