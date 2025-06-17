'use client';
import WaterProperty from "@/components/waterproperty";
import Efficiency from "@/components/efficiencydonut";
import ChemicalDosage from "@/components/chemicalDosage";
import ChemicalChart from "@/components/chemicalchart";
import TreatedWaterChart from "@/components/treatedwatergraph";
import FlowRaterChart from "@/components/flowratechart";
import EnergyEfficiency from "@/components/energyefficiency";
import clsx from "clsx";
import { useState } from "react";
export default function Home() {
  const [view, setView] = useState('hourly')
  const efficiency = 95;
  const getStatus = (value) => {
    if (value > 80) return { label: "Normal", color: "green" };
    if (value > 65) return { label: "Moderate", color: "yellow" };
    return { label: "Alert", color: "red" };
  };
  const status = getStatus(efficiency);
  const dotClass = clsx("h-3 w-3 rounded-full", {
    "bg-green-500": status.color === "green",
    "bg-yellow-500": status.color === "yellow",
    "bg-red-500": status.color === "red",
  });
  const textClass = clsx("text-lg font-medium", {
    "text-green-500": status.color === "green",
    "text-yellow-500": status.color === "yellow",
    "text-red-500": status.color === "red",
  });
  return (
    <main className="min-h-screen  max-w-screen bg-gray-100 ">
      {/* Top Bar */}
      <div className="flex mx-4 p-2 justify-between items-center bg-blue-100 rounded-md">
        <div className="flex gap-4 items-center">
          <img src="/company_logo[1].png" alt="logo" className="w-48" />
          <p className="text-3xl font-semibold">Water Monitoring Dashboard</p>
          <p className="text-lg font-medium">Last Updated</p>
          <span>17 June 2025 11:17 hr</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={dotClass} />
          <p className={textClass}>{status.label}</p>
        </div>
      </div>
      {/* Middle Part */}
      <div className=" px-4 mt-2 flex gap-3">
        {/* left container */}
        <div className="flex-3/4 flex flex-col gap-2">
          <WaterProperty />
          <img src="/Raw Water.png" alt="mimic" className="rounded-md shadow-md h-[307px]" />
        </div>


        {/* right container */}
        <div className="flex-1/4 flex flex-col gap-2">
          <div className="h-48 flex justify-between">
            <Efficiency />
            <EnergyEfficiency/>
          </div>
          <div className="p-2 h-max bg-white rounded-md shadow-md">
            <p className="text-lg font-medium">Energy Consumed per Liter</p>
            <p className="text-2xl font-bold mt-1">
              0.25 <span className="text-base font-medium">kWh/L</span>
            </p>
          </div>
          <div className=" bg-white h-max p-2 rounded-md shadow-md">
            <div className="flex gap-1">
              <p className="text-lg font-medium flex  items-center flex-2/3">Chemical Dosage</p>
              <div className="  flex justify-center items-center">
                <select className="border border-gray-300 rounded-md text-lg p-1 shadow-md" value={view} onChange={(e) => setView(e.target.value)}>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            <ChemicalDosage view={view} />
          </div>
        </div>
      </div>
      <div className="flex gap-3 mx-4 mt-2">
        <TreatedWaterChart view={view} />
        <FlowRaterChart view={view} />
        <ChemicalChart view={view} />
      </div>
    </main>
  );
}
