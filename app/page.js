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
  const [view, setView] = useState('hourly');
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
    <main className="min-h-screen w-full bg-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row mx-4 p-2 justify-between items-start md:items-center bg-blue-100 rounded-md gap-2">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <img src="/company_logo[1].png" alt="logo" className="w-48" />
          <p className="text-2xl md:text-3xl font-semibold">Water Monitoring Dashboard</p>
          <div className="flex gap-2 items-center">
            <p className="text-lg font-medium">Last Updated</p>
            <span>17 June 2025 11:17 hr</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={dotClass} />
          <p className={textClass}>{status.label}</p>
        </div>
      </div>

      {/* Middle Section */}
      <div className="px-4 mt-2 flex flex-col lg:flex-row gap-3">
        {/* Left Container */}
        <div className="w-full lg:w-3/4 flex flex-col gap-2">
          <WaterProperty />
            <img src="/Raw Water.png" alt="mimic" className="rounded-md shadow-md w-full max-h-[315px] object-cover" />
          
        </div>

        {/* Right Container */}
        <div className="w-full lg:w-1/4 flex flex-col gap-2">
          {/* Efficiency Donuts */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Efficiency />
            <EnergyEfficiency />
          </div>

          {/* Energy Text Box */}
          <div className="bg-white p-4 rounded-md shadow-md text-center">
            <p className="text-base font-medium">Energy Consumed per Liter</p>
            <p className="text-2xl font-bold mt-1">
              0.25 <span className="text-base font-medium">kWh/L</span>
            </p>
          </div>

          {/* Chemical Dosage */}
          <div className="bg-white p-4 rounded-md shadow-md">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
              <p className="text-lg font-medium">Chemical Dosage</p>
              <select
                className="border border-gray-300 rounded-md text-sm p-1 shadow"
                value={view}
                onChange={(e) => setView(e.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <ChemicalDosage view={view} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mx-4 mt-3 pb-4">
        <TreatedWaterChart view={view} />
        <FlowRaterChart view={view} />
        <ChemicalChart view={view} />
      </div>
    </main>
  );
}
