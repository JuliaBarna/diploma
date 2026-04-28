"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { Sidebar } from "./Sidebar"

const SidebarCtx = createContext<(v: boolean) => void>(() => {})
export const useSidebarToggle = () => useContext(SidebarCtx)

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)")
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
      if (!e.matches) setOpen(false)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const sidebarWrapperStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.28s ease",
      }
    : {
        position: "sticky",
        top: 0,
        height: "100vh",
        flexShrink: 0,
      }

  return (
    <SidebarCtx.Provider value={setOpen}>
      <div style={{ display: "flex", minHeight: "100vh", background: "#0b0e14" }}>
        {/* Backdrop (mobile) */}
        {isMobile && (
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              background: "rgba(0,0,0,0.65)",
              opacity: open ? 1 : 0,
              pointerEvents: open ? "auto" : "none",
              transition: "opacity 0.28s",
            }}
          />
        )}

        <div style={sidebarWrapperStyle}>
          <Sidebar onClose={() => setOpen(false)} />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {children}
        </div>
      </div>
    </SidebarCtx.Provider>
  )
}
