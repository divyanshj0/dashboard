'use client';
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useRouter } from 'next/navigation';
import { FiUser, FiLogOut } from 'react-icons/fi';
import WaterProperty from "@/components/waterproperty";
import Efficiency from "@/components/efficiencydonut";
import EnergyEfficiency from "@/components/energyefficiency";
import ChemicalDosage from "@/components/chemicalDosage";
import TreatedWaterChart from "@/components/treatedwatergraph";
import FlowRaterChart from "@/components/flowratechart";
import ChemicalChart from "@/components/chemicalchart";

export default function Dashboard() {
  const router = useRouter();
  const [view, setView] = useState('hourly');
  const [efficiency, setEfficiency] = useState(null);
  const [energyEfficiency, setEnergyEfficiency] = useState(null);
  const [energyConsumed, setEnergyConsumed] = useState(null);
  const [pump, setPump] = useState(false);
  const [pumprate, setPumprate] = useState(null);
  const [inletflow, setInletflow] = useState(null);
  const [inlettds, setInlettds] = useState(null);
  const [outletflow, setOutletflow] = useState(null);
  const [outlettds, setOutlettds] = useState(null);
  const [rejectflow, setRejectflow] = useState(null);
  const [rejecttds, setRejecttds] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTelemetry = async () => {
      const token = localStorage.getItem('tb_token');
      const devices = JSON.parse(localStorage.getItem('tb_devices'));

      try {
        const res = await fetch('/api/thingsboard/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, devices }),
        });

        const data = await res.json();

        setEfficiency(parseFloat(data['Efficiency Device']?.outputEfficiency?.[0]?.value || 0));
        setEnergyEfficiency(parseFloat(data['Efficiency Device']?.energyEfficiency?.[0]?.value || 0));
        setEnergyConsumed(parseFloat(data['Efficiency Device']?.energyConsumed?.[0]?.value || 0));
        setPump(data['Pump Device']?.pumpStatus?.[0]?.value || 0);
        setPumprate(parseFloat(data['Pump Device']?.runTime?.[0]?.value || 0));
        setInletflow(parseFloat(data['Water properties Device']?.inletFlowRate?.[0]?.value || 0));
        setInlettds(parseFloat(data['Water properties Device']?.inletTds?.[0]?.value || 0));
        setOutletflow(parseFloat(data['Water properties Device']?.outletFlowRate?.[0]?.value || 0));
        setOutlettds(parseFloat(data['Water properties Device']?.outletTds?.[0]?.value || 0));
        setRejectflow(parseFloat(data['Water properties Device']?.rejectFlowRate?.[0]?.value || 0));
        setRejecttds(parseFloat(data['Water properties Device']?.rejectTds?.[0]?.value || 0));
      } catch (err) {
        console.error("Telemetry fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, []);

  useEffect(() => {
    const user = localStorage.getItem('userName');
    if (user) {
      setName(user);
    }
  }, []);

  const getStatus = (value) => {
    if (value > 80) return { label: "Normal", color: "green" };
    if (value > 65) return { label: "Moderate", color: "yellow" };
    return { label: "Alert", color: "red" };
  };

  const status = getStatus(efficiency ?? 0);
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

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  return (
    <>
      {/* Spinner Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-80">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-blue-700 font-medium">Loading dashboard data...</p>
        </div>
      )}

      {/* Main Dashboard */}
      <main className={clsx("min-h-screen w-full bg-gray-100 transition-opacity duration-300", {
        "opacity-50 pointer-events-none select-none": loading
      })}>

        {/* Header */}
        <div className="flex flex-col md:flex-row mx-4 p-2 justify-between items-start md:items-center bg-blue-100 rounded-md gap-2">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <img src="/company_logo[1].png" alt="logo" className="w-48" />
            <p className="text-2xl md:text-3xl font-semibold">Water Monitoring Dashboard</p>
            <div className="flex gap-2 items-center">
              <p className="text-lg font-medium">Last Updated</p>
              <span>2 July 2025 14:05:01</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={dotClass} />
            <p className={textClass}>{status.label}</p>
          </div>
          <div className="relative inline-block text-left">
            <div className="text-md bg-white shadow-md p-2 flex items-center text-black rounded-md cursor-pointer" onClick={() => setShowMenu((prev) => !prev)}>
              <FiUser size={24} className="mr-2" /> {name}
            </div>

            {showMenu && (
              <div className="absolute right-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={handleLogout}>
                    <FiLogOut size={20} className="mr-2" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Section */}
        <div className="px-4 mt-2 flex flex-col lg:flex-row gap-3">
          <div className="w-full lg:w-3/4 flex flex-col gap-2">
            <WaterProperty 
            pumprate={pumprate} pump={pump} inletflow={inletflow} inlettds={inlettds} outletflow={outletflow} outlettds={outlettds} rejectflow={rejectflow} rejecttds={rejecttds}
            />
            <img src="/Raw Water.png" alt="mimic" className="rounded-md shadow-md w-full max-h-[315px] object-cover" />
          </div>

          <div className="w-full lg:w-1/4 flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Efficiency value={efficiency} />
              <EnergyEfficiency value={energyEfficiency} />
            </div>
            <div className="bg-white p-4 rounded-md shadow-md text-center">
              <p className="text-base font-medium">Energy Consumed per Liter</p>
              <p className="text-2xl font-bold mt-1">
                {energyConsumed?.toFixed(2) || '...'} <span className="text-base font-medium">kWh/L</span>
              </p>
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mx-4 mt-3">
          <TreatedWaterChart view={view} />
          <FlowRaterChart view={view} />
          <ChemicalChart view={view} />
        </div>

        {/* Footer */}
        <div className="bg-blue-100 text-center mx-4 mt-2 py-4 rounded-md">
          <p className="text-lg text-black">
            © 2025 All rights reserved. Developed and managed by TheElitePro
          </p>
        </div>
      </main>
    </>
  );
}
