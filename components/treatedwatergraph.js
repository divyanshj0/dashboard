'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { FiMaximize } from 'react-icons/fi';
import { FaFileDownload } from "react-icons/fa";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6366F1"];

function transformSeries(series) {
  const points = {};
  series.forEach((s) => {
    s.data.forEach(({ ts, value }) => {
      const time = new Date(ts).toLocaleString([], {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Use 24-hour format
      }).replace(',', '');
      if (!points[time]) points[time] = { time };
      points[time][s.label] = value;
    });
  });
  return Object.values(points);
}

function downloadCSV(data, title) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),                       // header line
    ...data.map(row => headers.map(h => row[h] ?? '').join(',')) // data rows
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const filename = `${title.replace(/\s+/g, '_').toLowerCase()}_data.csv`;

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function TreatedWaterChart({ title = "", series = [], saveLayout }) {
  const [isOpen, setIsOpen] = useState(false);
  const chartData = transformSeries(series).slice(-20).reverse();
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
        <XAxis dataKey="time" />
        <YAxis>
          <Label value={series[0]?.unit || 'Value'} angle={-90} position="insideLeft" />
        </YAxis>
        <Tooltip cursor={false} />
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
        <div className={`${saveLayout ? 'hidden' : 'flex gap-5'}`}>
          <button onClick={() => downloadCSV(chartData, title)} title="Download DataFile" className='cursor-pointer' >
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
