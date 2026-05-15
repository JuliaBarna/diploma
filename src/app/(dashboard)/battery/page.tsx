import { BatterySimulator } from "@/components/battery/BatterySimulator";
import { Header } from "@/components/layout/Header";

export default function BatteryPage() {
  return (
    <>
      <Header
        title="Симуляція накопичувача енергії"
      />
      <main className="page-main" style={{ flex: 1, padding: "28px" }}>
      <BatterySimulator />
      </main>
    </>
  );
}
