'use client';
import { hourlydata, dailydata, weeklydata } from '@/libs/data';

export default function ChemicalDosage({view}) {
    const getchartdata = () => {
        switch (view) {
            case 'hourly': return { data: hourlydata, xkey: 'hour' }
            case 'daily': return { data: dailydata, xkey: 'day' }
            case 'weekly': return { data: weeklydata, xkey: 'week' }
            default: return { data: [], xkey: '' };
        }
    };
    const { data, xKey } = getchartdata();
    const average = (key) =>
        data.length
            ? (data.reduce((sum, d) => sum + (d[key] || 0), 0) / data.length).toFixed(1)
            : '0.0';
    return (
        <>
            <div className="text-gray-500">
                <div className="flex py-1 items-center gap-4">
                    <p className="text-sm font-medium">{view} Avg coagulant</p>
                    <span>{average("coagulant")} ppm</span>
                </div>
                <div className="flex py-1 items-center gap-4">
                    <p className="text-sm font-medium">{view} Avg Antiscalent</p>
                    <span>{average("antiscalant")} ppm</span>
                </div>
                <div className="flex py-1 items-center gap-4">
                    <p className="text-sm font-medium">{view} Avg ph Adjuster</p>
                    <span>{average("ph_adjuster")} ppm</span>
                </div>
            </div>

            
        </>
    )
}