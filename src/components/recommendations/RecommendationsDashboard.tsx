"use client"

import { useState, useEffect } from "react"
import type { Recommendation, RecommendationType } from "@/app/api/recommendations/route"

const C = {
  card:   "var(--c-card)",
  border: "var(--c-border)",
  text:   "var(--c-text)",
  muted:  "var(--c-muted)",
  dim:    "var(--c-dim)",
}

const TYPE_CONFIG: Record<RecommendationType, { color: string; bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    color: "#22c55e", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  info: {
    color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  warning: {
    color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  danger: {
    color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
}

const TYPE_LABEL: Record<RecommendationType, string> = {
  danger:  "Критично",
  warning: "Увага",
  info:    "Інформація",
  success: "Добре",
}

const ORDER: RecommendationType[] = ["danger", "warning", "info", "success"]

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const cfg = TYPE_CONFIG[rec.type]
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px",
      padding: "24px", display: "flex", gap: "20px",
      borderLeft: `3px solid ${cfg.color}`,
      transition: "box-shadow 0.15s",
    }}>
      {/* Icon */}
      <div style={{
        width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase",
            color: cfg.color, padding: "2px 8px", borderRadius: "20px",
            background: cfg.bg, border: `1px solid ${cfg.border}`,
          }}>
            {TYPE_LABEL[rec.type]}
          </span>
          {rec.metric && (
            <span style={{
              fontSize: "13px", fontWeight: 700, color: cfg.color,
              fontFamily: "'Geist Mono', monospace",
            }}>
              {rec.metric}
            </span>
          )}
        </div>

        <h3 style={{ fontSize: "15px", fontWeight: 600, color: C.text, margin: "0 0 6px" }}>
          {rec.title}
        </h3>
        <p style={{ fontSize: "13px", color: C.muted, margin: 0, lineHeight: 1.6 }}>
          {rec.description}
        </p>

        {rec.action && (
          <div style={{
            marginTop: "12px", padding: "10px 14px",
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            borderRadius: "8px", fontSize: "13px", color: cfg.color,
            display: "flex", alignItems: "flex-start", gap: "8px",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {rec.action}
          </div>
        )}
      </div>
    </div>
  )
}

export function RecommendationsDashboard() {
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/recommendations")
      .then(r => r.json())
      .then(data => { setRecs(data); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: C.dim, fontSize: "14px" }}>
        Аналізуємо дані...
      </div>
    )
  }

  const sorted = [...recs].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type))

  const counts = {
    danger:  recs.filter(r => r.type === "danger").length,
    warning: recs.filter(r => r.type === "warning").length,
    info:    recs.filter(r => r.type === "info").length,
    success: recs.filter(r => r.type === "success").length,
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Summary bar */}
      <div style={{
        display: "flex", gap: "12px", flexWrap: "wrap",
        background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 20px",
      }}>
        {(Object.entries(counts) as [RecommendationType, number][])
          .filter(([, n]) => n > 0)
          .map(([type, count]) => {
            const cfg = TYPE_CONFIG[type]
            return (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: cfg.color }} />
                <span style={{ fontSize: "13px", color: C.muted }}>{TYPE_LABEL[type]}</span>
                <span style={{ fontSize: "18px", fontWeight: 700, color: C.text }}>{count}</span>
              </div>
            )
          })}
        <span style={{ marginLeft: "auto", fontSize: "12px", color: C.dim, alignSelf: "center" }}>
          На основі даних за останні 30 днів
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {sorted.map(rec => <RecommendationCard key={rec.id} rec={rec} />)}
      </div>
    </div>
  )
}
