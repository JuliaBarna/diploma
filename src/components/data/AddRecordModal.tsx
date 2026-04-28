"use client"

import { useState } from "react"

interface Props {
  onClose: () => void
  onSaved: () => void
}

export function AddRecordModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    device: "", location: "", consumption: "", power: "",
    recordedAt: new Date().toISOString().split("T")[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.device || !form.consumption || !form.recordedAt) {
      setError("Заповніть обов'язкові поля")
      return
    }
    setLoading(true)
    const res = await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      onSaved()
    } else {
      const data = await res.json()
      setError(data.error || "Помилка збереження")
      setLoading(false)
    }
  }

  const inputStyle = {
    width: "100%", background: "#0f1117", border: "1px solid #1e2535",
    borderRadius: "8px", padding: "10px 12px", color: "#f1f5f9",
    fontSize: "13px", outline: "none", boxSizing: "border-box" as const,
  }

  const labelStyle = {
    display: "block" as const, color: "#94a3b8", fontSize: "12px",
    marginBottom: "6px", fontWeight: 500,
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
    }}>
      <div style={{
        background: "#13161f", border: "1px solid #1e2535", borderRadius: "16px",
        padding: "28px", width: "100%", maxWidth: "440px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ color: "#f1f5f9", fontSize: "16px", fontWeight: 600, margin: 0 }}>Додати запис</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "8px", padding: "10px 12px", color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Пристрій *</label>
            <input style={inputStyle} value={form.device} onChange={(e) => set("device", e.target.value)} placeholder="напр. Кондиціонер" />
          </div>
          <div>
            <label style={labelStyle}>Локація</label>
            <input style={inputStyle} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="напр. Офіс 1" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Споживання (кВт·год) *</label>
              <input style={inputStyle} type="number" step="0.01" value={form.consumption}
                onChange={(e) => set("consumption", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Потужність (кВт)</label>
              <input style={inputStyle} type="number" step="0.01" value={form.power}
                onChange={(e) => set("power", e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Дата *</label>
            <input style={inputStyle} type="date" value={form.recordedAt} onChange={(e) => set("recordedAt", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
          <button onClick={onClose} style={{
            flex: 1, background: "transparent", border: "1px solid #1e2535",
            borderRadius: "8px", padding: "10px", color: "#94a3b8", cursor: "pointer", fontSize: "13px",
          }}>
            Скасувати
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            border: "none", borderRadius: "8px", padding: "10px", color: "white",
            cursor: loading ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500,
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      </div>
    </div>
  )
}