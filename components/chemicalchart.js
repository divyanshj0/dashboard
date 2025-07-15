'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Label
} from 'recharts';
import { FiMaximize } from 'react-icons/fi';
import { useState } from 'react';

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6366F1"];

function transformSeries(series) {
  const points = {};
  series.forEach((s) => {
    s.data.forEach(({ ts, value }) => {
      const time = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!points[time]) points[time] = { time };
      points[time][s.label] = value;
    });
  });
  return Object.values(points);
}

export default function ChemicalChart({ title = "", series = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const chartData = transformSeries(series).slice(-20);

  const Chart = ({ data, fullView }) => (
    <ResponsiveContainer width="100%" height={fullView ? 300 : 150}>
      <BarChart data={data}>
        <XAxis dataKey="time" />
        <YAxis>
          <Label value={series[0]?.unit || 'Value'} angle={-90} position="insideLeft" />
        </YAxis>
        <Tooltip />
        <Legend />
        {series.map((s, idx) => (
          <Bar key={s.label} dataKey={s.label} fill={COLORS[idx % COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="bg-white h-full w-full rounded-md shadow-md">
      <div className="flex items-center gap-15 px-2 pt-1">
        <p className="text-lg font-medium">{title}</p>
        <button onClick={() => setIsOpen(true)} title="fullscreen">
          <FiMaximize />
        </button>
      </div>
      <Chart data={chartData} fullView={false} />
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center px-2">
          <div className="bg-white p-4 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{title}</h2>
              <button onClick={() => setIsOpen(false)} className="text-lg bg-red-600">✕</button>
            </div>
            <Chart data={chartData} fullView={true} />
          </div>
        </div>
      )}
    </div>
  );
}
