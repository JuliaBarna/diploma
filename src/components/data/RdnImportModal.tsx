"use client"

import { useState, useRef } from "react"

const C = {
  card:   "var(--c-card)",
  border: "var(--c-border)",
  bg:     "var(--c-bg)",
  text:   "var(--c-text)",
  muted:  "var(--c-muted)",
  dim:    "var(--c-dim)",
  green:  "#22c55e",
  red:    "#ef4444",
  blue:   "#3b82f6",
}

interface Props {
  onClose: () => void
  onImported: () => void
}

export function RdnImportModal({ onClose, onImported }: Props) {
  const [file, setFile]       = useState<File | null>(null)
  const [month, setMonth]     = useState<string>("")
  const [status, setStatus]   = useState<"idle" | "loading" | "ok" | "err">("idle")
  const [message, setMessage] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setStatus("idle")
    setMessage("")
  }

  async function handleImport() {
    if (!file || !month) return
    setStatus("loading")
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("month", month)
      const res  = await fetch("/api/rdn/import", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Помилка сервера")
      setStatus("ok")
      setMessage(`Імпортовано ${data.imported} записів`)
      onImported()
    } catch (e) {
      setStatus("err")
      setMessage(e instanceof Error ? e.message : "Невідома помилка")
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px",
        padding: "28px", width: "min(440px, 95vw)", display: "flex", flexDirection: "column", gap: "16px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: "17px", color: C.text }}>Імпорт цін РДН</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ fontSize: "13px", color: C.dim, lineHeight: 1.6 }}>
          Файл УЕРЕМ: рядки = дні, стовпці = години 1–24, грн/МВт·год.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "12px", color: C.muted, fontWeight: 500 }}>Місяць</label>
          <input
            type="month"
            value={month}
            onChange={e => { setMonth(e.target.value); setStatus("idle"); setMessage("") }}
            style={{
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: "8px",
              padding: "10px 14px", color: month ? C.text : C.muted,
              fontSize: "13px", outline: "none", colorScheme: "light dark",
              width: "100%", boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: "8px",
            padding: "10px 16px", color: file ? C.text : C.muted,
            cursor: "pointer", fontSize: "13px",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {file ? file.name : "Вибрати .xls / .xlsx файл"}
        </button>
        <input ref={fileRef} type="file" accept=".xls,.xlsx" onChange={handleFile} style={{ display: "none" }} />

        {status === "ok"  && <div style={{ color: C.green, fontSize: "13px" }}>✓ {message}</div>}
        {status === "err" && <div style={{ color: C.red,   fontSize: "13px" }}>✗ {message}</div>}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "9px 18px", color: C.muted, cursor: "pointer", fontSize: "13px" }}>
            Закрити
          </button>
          <button
            onClick={handleImport}
            disabled={!file || !month || status === "loading"}
            style={{
              background: C.blue, border: "none", borderRadius: "8px",
              padding: "9px 20px", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600,
              opacity: !file || !month || status === "loading" ? 0.6 : 1,
            }}
          >
            {status === "loading" ? "Імпортую..." : "Імпортувати"}
          </button>
        </div>
      </div>
    </div>
  )
}
