import { Header } from "@/components/layout/Header"
import { DataTable } from "@/components/data/DataTable"

export default function DataPage() {
  return (
    <>
      <Header title="Таблиця даних" subtitle="Управління записами споживання електроенергії" />
      <main style={{ flex: 1, padding: "28px" }}>
        <DataTable />
      </main>
    </>
  )
}