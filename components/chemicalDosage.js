'use client';
import { hourlydata, dailydata, weeklydata } from '@/libs/data';

export default function ChemicalDosage({ view }) {
  const getChartData = () => {
    switch (view) {
      case 'hourly':
        return { data: hourlydata, xKey: 'hour' };
      case 'daily':
        return { data: dailydata, xKey: 'day' };
      case 'weekly':
        return { data: weeklydata, xKey: 'week' };
      default:
        return { data: [], xKey: '' };
    }
  };

  const { data } = getChartData();

  const average = (key) =>
    data.length
      ? (data.reduce((sum, d) => sum + (d[key] || 0), 0) / data.length).toFixed(1)
      : '0.0';

  return (
    <div className="text-gray-700 mt-2 flex flex-col gap-2">
      <div className="flex justify-between items-center text-sm">
        <p className="font-medium capitalize">{view} Avg Coagulant</p>
        <span>{average('coagulant')} ppm</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <p className="font-medium capitalize">{view} Avg Antiscalant</p>
        <span>{average('antiscalant')} ppm</span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <p className="font-medium capitalize">{view} Avg pH Adjuster</p>
        <span>{average('ph_adjuster')} ppm</span>
      </div>
    </div>
  );
}
