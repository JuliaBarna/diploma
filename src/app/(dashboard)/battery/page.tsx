import { BatterySimulator } from "@/components/battery/BatterySimulator";
import { Header } from "@/components/layout/Header";

export default function BatteryPage() {
  return (
    <>
      <Header
        title="Симуляція накопичувача енергії"
        subtitle=" Оптимізація споживання та накопичення електроенергії"
      />
      <main className="page-main" style={{ flex: 1, padding: "28px" }}>
      <BatterySimulator />
      </main>
    </>
  );
}
