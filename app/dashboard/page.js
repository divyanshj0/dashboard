'use client';
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useRouter } from 'next/navigation';
import { FiUser, FiLogOut, FiEdit2 } from 'react-icons/fi';

import WaterProperty from "@/components/waterproperty";
import Efficiency from "@/components/efficiencydonut";
import EnergyEfficiency from "@/components/energyefficiency";
import ChemicalDosage from "@/components/chemicalDosage";
import TreatedWaterChart from "@/components/treatedwatergraph";
import FlowRaterChart from "@/components/flowratechart";
import ChemicalChart from "@/components/chemicalchart";
import ConfigEditor from "@/components/ConfigEditor";

export default function Dashboard() {
  const router = useRouter();
  const [view, setView] = useState('hourly');
  const [config, setConfig] = useState({}); 
  const [telemetry, setTelemetry] = useState({});
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfigEditor, setShowConfigEditor] = useState(false);

  useEffect(() => {
    const fetchTelemetry = async () => {
      const token = localStorage.getItem('tb_token');
      const devices = JSON.parse(localStorage.getItem('tb_devices'));

      if (!token) {
        router.push('/');
        return;
      }

      try {
        const res = await fetch('/api/thingsboard/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, devices }),
        });

        const result = await res.json();
        setConfig(result.config || {});
        setTelemetry(result.telemetry || {});
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
    if (user) setName(user);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  const formatValue = (val, format) => {
    if (!val) return '...';
    const parsed = parseFloat(val);
    if (format === 'percent') return `${parsed.toFixed(1)}%`;
    if (format === 'number') return parsed.toFixed(2);
    return val;
  };

  // Generic getter for telemetry value using config
  const getSectionKeyValue = (section, index) => {
    const item = config?.[section]?.[index];
    if (!item) return null;
    const val = telemetry?.[section]?.[item.key]?.[0]?.value;
    return formatValue(val, item.format);
  };

  const getStatus = (value) => {
    const v = parseFloat(value) || 0;
    if (v > 80) return { label: "Normal", color: "green" };
    if (v > 65) return { label: "Moderate", color: "yellow" };
    return { label: "Alert", color: "red" };
  };

  const effVal = config?.efficiency?.[0] ? telemetry?.efficiency?.[config.efficiency[0].key]?.[0]?.value : 0;
  const status = getStatus(effVal);

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
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-80">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-blue-700 font-medium">Loading dashboard data...</p>
        </div>
      )}

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
              <span>4 July 17:05:07</span>
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
                  <button className="flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 w-full" onClick={() => {setShowConfigEditor(true); setShowMenu(false)}}>
                    <FiEdit2 size={20} className="mr-2" /> Customize
                  </button>
                  <button className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={handleLogout}>
                    <FiLogOut size={20} className="mr-2" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mimic and Properties */}
        <div className="px-4 mt-2 flex flex-col lg:flex-row gap-3">
          <div className="w-full lg:w-3/4 flex flex-col gap-2">
            <WaterProperty
              inletflow={getSectionKeyValue('inlet', 0)}
              inlettds={getSectionKeyValue('inlet', 1)}
              outletflow={getSectionKeyValue('inlet', 2)}
              outlettds={getSectionKeyValue('inlet', 3)}
              rejectflow={getSectionKeyValue('inlet', 4)}
              rejecttds={getSectionKeyValue('inlet', 5)}
              pumprate={getSectionKeyValue('pump', 1)}
              pump={getSectionKeyValue('pump', 0)}
            />
            <img src="/Raw Water.png" alt="mimic" className="rounded-md shadow-md w-full max-h-[315px] object-cover" />
          </div>

          <div className="w-full lg:w-1/4 flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              {config?.efficiency?.[0] && (
                <Efficiency value={parseFloat(getSectionKeyValue('efficiency', 0))} />
              )}
              {config?.efficiency?.[1] && (
                <EnergyEfficiency value={parseFloat(getSectionKeyValue('efficiency', 1))} />
              )}
            </div>

            {config?.output?.[0] && (
              <div className="bg-white p-4 rounded-md shadow-md text-center">
                <p className="text-base font-medium">{config.output[0].label}</p>
                <p className="text-2xl font-bold mt-1">
                  {getSectionKeyValue('output', 0)} <span className="text-base font-medium">kWh/L</span>
                </p>
              </div>
            )}

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

        <div className="bg-blue-100 text-center mx-4 mt-2 py-4 rounded-md">
          <p className="text-lg text-black">© 2025 All rights reserved. Developed and managed by TheElitePro</p>
        </div>

        {showConfigEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-white w-full sm:w-3/4 lg:w-1/2 max-h-[90vh] overflow-y-auto rounded-md p-4 shadow-lg relative">
              <button
                className="absolute top-2 right-2 text-red-600 text-xl font-bold"
                onClick={() => setShowConfigEditor(false)}
              >
                ✕
              </button>
              <ConfigEditor />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
