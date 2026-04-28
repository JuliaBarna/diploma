"use client"

import { useState, useEffect, useCallback } from "react"
import { ImportModal } from "./ImportModal"

interface EnergyRecord {
  id: string
  device: string
  location: string | null
  consumption: number
  power: number | null
  recordedAt: string
  createdAt: string
}

export function DataTable() {
  const [records, setRecords] = useState<EnergyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<keyof EnergyRecord>("recordedAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
const [showImportModal, setShowImportModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/records")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setRecords(data)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [refreshTick])

  const triggerRefetch = useCallback(() => {
    setLoading(true)
    setRefreshTick((t) => t + 1)
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Видалити запис?")) return
    setDeletingId(id)
    await fetch(`/api/records/${id}`, { method: "DELETE" })
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setDeletingId(null)
  }

  function handleSort(field: keyof EnergyRecord) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const filtered = records
    .filter((r) =>
      r.device.toLowerCase().includes(search.toLowerCase()) ||
      (r.location ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = a[sortField] ?? ""
      const bv = b[sortField] ?? ""
      return sortDir === "asc"
        ? av > bv ? 1 : -1
        : av < bv ? 1 : -1
    })

  const SortIcon = ({ field }: { field: keyof EnergyRecord }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      style={{ opacity: sortField === field ? 1 : 0.3, marginLeft: "4px" }}>
      {sortField === field && sortDir === "asc"
        ? <path d="M12 5v14M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M12 19V5M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"
            style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Пошук за пристроєм або локацією..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", background: "#13161f", border: "1px solid #1e2535",
              borderRadius: "8px", padding: "9px 12px 9px 38px", color: "#f1f5f9",
              fontSize: "13px", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Import */}
        <button
          onClick={() => setShowImportModal(true)}
          style={{
            display: "flex", alignItems: "center", gap: "7px",
            background: "#13161f", border: "1px solid #1e2535",
            borderRadius: "8px", padding: "9px 14px", color: "#94a3b8",
            fontSize: "13px", cursor: "pointer", fontWeight: 500,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Імпорт
        </button>

      </div>

      {/* Table */}
      <div style={{ background: "#13161f", border: "1px solid #1e2535", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e2535" }}>
                {[
                  { label: "Пристрій", field: "device" },
                  { label: "Локація", field: "location" },
                  { label: "Споживання (кВт·год)", field: "consumption" },
                  { label: "Потужність (кВт)", field: "power" },
                  { label: "Дата", field: "recordedAt" },
                ].map(({ label, field }) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field as keyof EnergyRecord)}
                    style={{
                      padding: "12px 16px", textAlign: "left", color: "#64748b",
                      fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
                      userSelect: "none",
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      {label}
                      <SortIcon field={field as keyof EnergyRecord} />
                    </span>
                  </th>
                ))}
                <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 500 }}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#475569" }}>
                    Завантаження...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px", textAlign: "center", color: "#475569" }}>
                    {search ? "Записів не знайдено" : "Немає записів. Додайте перший запис або імпортуйте CSV."}
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr
                    key={record.id}
                    style={{ borderBottom: "1px solid #1e2535", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", color: "#f1f5f9", fontWeight: 500 }}>{record.device}</td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{record.location ?? "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#3b82f6", fontFamily: "monospace" }}>
                      {record.consumption.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontFamily: "monospace" }}>
                      {record.power?.toFixed(2) ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                      {new Date(record.recordedAt).toLocaleDateString("uk-UA")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deletingId === record.id}
                        style={{
                          background: "transparent", border: "1px solid #1e2535",
                          borderRadius: "6px", padding: "5px 8px", color: "#ef4444",
                          cursor: "pointer", fontSize: "12px", opacity: deletingId === record.id ? 0.5 : 1,
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6M9 6V4h6v2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid #1e2535", color: "#475569", fontSize: "12px" }}>
            Показано {filtered.length} з {records.length} записів
          </div>
        )}
      </div>

{showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImported={() => { setShowImportModal(false); triggerRefetch() }}
        />
      )}
    </div>
  )
}