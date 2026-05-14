"use client"

import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { InverterTable } from "@/components/data/InverterTable"
import { RdnImportModal } from "@/components/data/RdnImportModal"

export default function DataPage() {
  const [showRdn, setShowRdn] = useState(false)

  return (
    <>
      <Header title="Дані інвертора" subtitle="Погодинна статистика PV-системи" />
      <main className="page-main" style={{ flex: 1, padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <button
            onClick={() => setShowRdn(true)}
            style={{
              display: "flex", alignItems: "center", gap: "7px",
              background: "var(--c-card)", border: "1px solid var(--c-border)",
              borderRadius: "8px", padding: "8px 14px", color: "var(--c-muted)",
              fontSize: "13px", cursor: "pointer", fontWeight: 500,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Імпорт цін РДН
          </button>
        </div>
        <InverterTable />
      </main>
      {showRdn && (
        <RdnImportModal
          onClose={() => setShowRdn(false)}
          onImported={() => setShowRdn(false)}
        />
      )}
    </>
  )
}
