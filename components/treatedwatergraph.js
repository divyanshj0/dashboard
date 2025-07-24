'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { FiMaximize } from 'react-icons/fi';
import { FaFileDownload } from "react-icons/fa";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6366F1"];

function transformSeries(series) {
  const allPoints = {};
  series.forEach(s => {
    s.data.forEach(({ ts, value }) => {
      const timestamp = Number(ts);
      if (!allPoints[timestamp]) {
        allPoints[timestamp] = { ts: timestamp };
      }
      allPoints[timestamp][s.label] = value;
    });
  });
  return Object.values(allPoints).sort((a, b) => a.ts - b.ts);
}

function downloadCSV(data, title, view) {
  if (!data.length) return;

  const formattedData = data.map(row => {
    const date = new Date(row.ts);
    const timeString = view === 'hourly'
      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : date.toLocaleDateString('en-GB');

    const newRow = { ...row };
    delete newRow.ts;
    return { time: timeString, ...newRow };
  });

  const headers = Object.keys(formattedData[0]);
  const csvContent = [
    headers.join(','),
    ...formattedData.map(row => headers.map(h => row[h] ?? '').join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_${view}_data.csv`;

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function TreatedWaterChart({ title = "", series = [], saveLayout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('hourly');

  const getDisplayData = () => {
    const fullData = transformSeries(series);
    const now = Date.now();
    let filteredData = [];

    if (view === 'hourly') {
      const oneDayAgo = now - (1000 * 60 * 60 * 24);
      filteredData = fullData.filter(d => d.ts >= oneDayAgo);
    } else { // weekly
      const sevenDaysAgo = now - (1000 * 60 * 60 * 24 * 7);
      filteredData = fullData.filter(d => d.ts >= sevenDaysAgo);
    }
    return filteredData;
  };

  const chartData = getDisplayData();

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const Chart = ({ data, fullView }) => (
    <ResponsiveContainer width="95%" height={fullView ? "90%" : "80%"}>
      <LineChart data={data}>
        <XAxis
          dataKey="ts"
          tickFormatter={(ts) => {
            const date = new Date(ts);
            return view === 'hourly'
              ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
              : date.toLocaleDateString('en-GB');
          }}
        />
        <YAxis>
          <Label value={series[0]?.unit || 'Value'} angle={-90} offset={15} fontSize={20} position="insideLeft" />
        </YAxis>
        <Tooltip
          labelFormatter={(ts) => new Date(ts).toLocaleString()}
          cursor={false}
        />
        <Legend />
        {series.map((s, idx) => (
          <Line key={s.label} dataKey={s.label} stroke={COLORS[idx % COLORS.length]} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="bg-white h-full w-full  border-gray-200 rounded-md shadow-sm">
      <div className="flex items-center justify-between px-2 pt-1">
        <p className="text-lg font-medium">{title}</p>
        <div className={`${saveLayout ? 'hidden' : 'flex gap-5 items-center'}`}>
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="border rounded p-1 text-sm"
          >
            <option value="hourly">Hourly (Last 1 Day)</option>
            <option value="weekly">Weekly (Last 7 Days)</option>
          </select>
          <button onClick={() => downloadCSV(chartData, title, view)} title="Download DataFile" className='cursor-pointer' >
            <FaFileDownload />
          </button>
          <button onClick={() => setIsOpen(true)} title="fullscreen" className='cursor-pointer'>
            <FiMaximize />
          </button>
        </div>
      </div>
      <Chart data={chartData} fullView={false} />
      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center px-2">
          <div className="bg-white p-4 rounded-lg w-full max-w-[90vw] h-[90vh] overflow-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{title}</h2>
              <button onClick={() => setIsOpen(false)} className="text-lg">✕</button>
            </div>
            <Chart data={chartData} fullView={true} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}