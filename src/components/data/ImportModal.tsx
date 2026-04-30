"use client"

import { useState, useRef } from "react"

interface Props {
  onClose: () => void
  onImported: () => void
}

export function ImportModal({ onClose, onImported }: Props) {
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  function parseCSV(text: string) {
    const lines = text.trim().split("\n")
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    return lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim())
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = vals[i] ?? "" })
      return obj
    })
  }

  async function handleFile(f: File) {
    setFile(f)
    setError("")
    const text = await f.text()
    try {
      const parsed = parseCSV(text)
      setPreview(parsed.slice(0, 3))
    } catch {
      setError("Не вдалося розпізнати файл")
    }
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)
    const text = await file.text()
    const records = parseCSV(text)

    const res = await fetch("/api/records/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    })

    if (res.ok) {
      onImported()
    } else {
      const data = await res.json()
      setError(data.error || "Помилка імпорту")
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }}>
      <div style={{
        background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: "16px",
        padding: "28px", width: "100%", maxWidth: "500px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ color: "var(--c-text)", fontSize: "16px", fontWeight: 600, margin: 0 }}>Імпорт CSV</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--c-dim)", cursor: "pointer", padding: "4px", display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{
          background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "8px", padding: "10px 12px", marginBottom: "16px", fontSize: "12px", color: "var(--c-muted)",
        }}>
          Очікуваний формат CSV: <code style={{ color: "#22c55e" }}>device, location, consumption, power, recordedAt</code>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px", padding: "10px 12px", color: "#ef4444", fontSize: "13px", marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          style={{
            border: `2px dashed ${dragging ? "#22c55e" : "var(--c-border)"}`,
            borderRadius: "10px", padding: "32px", textAlign: "center",
            cursor: "pointer", transition: "border-color 0.2s",
            background: dragging ? "rgba(34,197,94,0.05)" : "transparent",
          }}
        >
          <input ref={inputRef} type="file" accept=".csv" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--c-dim)" strokeWidth="1.5"
            style={{ margin: "0 auto 12px", display: "block" }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p style={{ color: file ? "#22c55e" : "var(--c-dim)", fontSize: "13px", margin: 0 }}>
            {file ? file.name : "Перетягніть CSV файл або натисніть для вибору"}
          </p>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: "var(--c-dim)", fontSize: "12px", marginBottom: "8px" }}>Попередній перегляд (перші 3 рядки):</p>
            <div style={{
              background: "var(--c-thead)", borderRadius: "8px", padding: "10px", fontSize: "11px",
              color: "var(--c-muted)", fontFamily: "'Geist Mono', monospace", overflowX: "auto",
            }}>
              {preview.map((row, i) => (
                <div key={i}>{JSON.stringify(row)}</div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
          <button onClick={onClose} style={{
            flex: 1, background: "transparent", border: "1px solid var(--c-border)",
            borderRadius: "8px", padding: "10px", color: "var(--c-muted)", cursor: "pointer", fontSize: "13px",
          }}>
            Скасувати
          </button>
          <button onClick={handleImport} disabled={!file || loading} style={{
            flex: 1, background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            border: "none", borderRadius: "8px", padding: "10px", color: "white",
            cursor: !file || loading ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500,
            opacity: !file || loading ? 0.5 : 1,
          }}>
            {loading ? "Імпортування..." : "Імпортувати"}
          </button>
        </div>
      </div>
    </div>
  )
}
