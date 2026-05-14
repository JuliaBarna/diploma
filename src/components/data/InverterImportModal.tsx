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

type FileStatus = "idle" | "loading" | "ok" | "err"

interface FileState {
  file: File
  status: FileStatus
  message: string
}

interface Props {
  onClose: () => void
  onImported: (count: number, date: string) => void
}

export function InverterImportModal({ onClose, onImported }: Props) {
  const [fileStates, setFileStates] = useState<FileState[]>([])
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setFileStates(files.map(file => ({ file, status: "idle", message: "" })))
  }

  function updateState(idx: number, patch: Partial<FileState>) {
    setFileStates(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  async function handleImport() {
    if (fileStates.length === 0) return
    setImporting(true)

    let lastDate = ""
    let totalImported = 0

    for (let i = 0; i < fileStates.length; i++) {
      updateState(i, { status: "loading", message: "" })
      try {
        const form = new FormData()
        form.append("file", fileStates[i].file)
        const res = await fetch("/api/inverter/import", { method: "POST", body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Помилка сервера")
        updateState(i, { status: "ok", message: `${data.imported} год · ${data.date}` })
        lastDate = data.date
        totalImported += data.imported
      } catch (e) {
        updateState(i, { status: "err", message: e instanceof Error ? e.message : "Помилка" })
      }
    }

    setImporting(false)
    if (lastDate) onImported(totalImported, lastDate)
  }

  const doneCount = fileStates.filter(s => s.status === "ok").length
  const errCount  = fileStates.filter(s => s.status === "err").length
  const allDone   = fileStates.length > 0 && fileStates.every(s => s.status === "ok" || s.status === "err")

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px",
        padding: "28px", width: "min(520px, 95vw)", display: "flex", flexDirection: "column", gap: "16px",
        maxHeight: "85vh",
      }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: "17px", color: C.text }}>Імпорт звітів інвертора</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ fontSize: "13px", color: C.dim, lineHeight: 1.6 }}>
          Виберіть один або кілька Excel-файлів. Дата визначається автоматично з кожного файлу.
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: C.bg, border: `1px solid ${C.border}`, borderRadius: "8px",
            padding: "10px 16px", color: fileStates.length > 0 ? C.text : C.muted,
            cursor: importing ? "default" : "pointer", fontSize: "13px",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {fileStates.length > 0 ? `${fileStates.length} файл(ів) вибрано` : "Вибрати .xlsx файли"}
        </button>
        <input ref={fileRef} type="file" accept=".xlsx" multiple onChange={handleFiles} style={{ display: "none" }} />

        {fileStates.length > 0 && (
          <div style={{
            overflowY: "auto", maxHeight: "280px",
            border: `1px solid ${C.border}`, borderRadius: "8px",
            display: "flex", flexDirection: "column",
          }}>
            {fileStates.map((fs, idx) => (
              <div key={idx} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 14px",
                borderBottom: idx < fileStates.length - 1 ? `1px solid ${C.border}` : "none",
              }}>
                <span style={{ fontSize: "18px", lineHeight: 1, flexShrink: 0 }}>
                  {fs.status === "idle"    && <span style={{ color: C.dim }}>·</span>}
                  {fs.status === "loading" && <Spinner />}
                  {fs.status === "ok"      && <span style={{ color: C.green }}>✓</span>}
                  {fs.status === "err"     && <span style={{ color: C.red }}>✗</span>}
                </span>
                <span style={{ fontSize: "12px", color: C.muted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {fs.file.name}
                </span>
                {fs.message && (
                  <span style={{ fontSize: "12px", color: fs.status === "err" ? C.red : C.dim, flexShrink: 0 }}>
                    {fs.message}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {allDone && (
          <div style={{ fontSize: "13px", color: doneCount > 0 ? C.green : C.red }}>
            {doneCount > 0 && `✓ Імпортовано ${doneCount} з ${fileStates.length} файлів`}
            {errCount > 0  && ` · ${errCount} помилок`}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", padding: "9px 18px", color: C.muted, cursor: "pointer", fontSize: "13px" }}>
            Закрити
          </button>
          <button
            onClick={handleImport}
            disabled={fileStates.length === 0 || importing || allDone}
            style={{
              background: C.blue, border: "none", borderRadius: "8px",
              padding: "9px 20px", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600,
              opacity: fileStates.length === 0 || importing || allDone ? 0.5 : 1,
            }}
          >
            {importing ? `Імпортую ${doneCount + errCount + 1}/${fileStates.length}…` : "Імпортувати"}
          </button>
        </div>

      </div>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{ display: "inline-block", width: "14px", height: "14px" }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" style={{ animation: "spin 0.8s linear infinite" }}>
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </span>
  )
}
