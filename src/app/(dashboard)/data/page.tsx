import { Header } from "@/components/layout/Header"
import { InverterTable } from "@/components/data/InverterTable"

export default function DataPage() {
  return (
    <>
      <Header title="Дані інвертора" subtitle="Погодинна статистика PV-системи" />
      <main className="page-main" style={{ flex: 1, padding: "28px" }}>
        <InverterTable />
      </main>
    </>
  )
}
