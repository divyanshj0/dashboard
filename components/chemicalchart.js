'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { hourlydata, dailydata, weeklydata } from '@/libs/data';
import { FiMaximize } from "react-icons/fi";
import { useState } from "react";

export default function ChemicalChart({view}) {
    const [isOpen, setIsOpen] = useState(false);
    const getchartdata = () => {
        switch (view) {
            case 'hourly': return { data: hourlydata, xkey: 'hour' }
            case 'daily': return { data: dailydata, xkey: 'day' }
            case 'weekly': return { data: weeklydata, xkey: 'week' }
            default: return { data: [], xkey: '' };
        }
    };
    const { data, xKey } = getchartdata();
    const miniData = data.slice(-3);
    const Chart = ({ chartData, fullView }) => (
        <ResponsiveContainer width="100%" height={fullView ? 300 : 150}>
            <BarChart data={chartData}>
                <XAxis dataKey={xKey} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="coagulant" fill="#3B82F6" />
                <Bar dataKey="antiscalant" fill="#10B981" />
                <Bar dataKey="ph_adjuster" fill="#F59E0B" />
            </BarChart>
        </ResponsiveContainer>
    );
    return (
        <div className=" bg-white  h-48 w-full rounded-md shadow-md">
            <div className="flex items-center  justify-between px-2">
                <p className="text-lg font-medium">Chemical Dosage Graph</p>
                <button onClick={() => setIsOpen(true)} title="fullscreen">
                    <FiMaximize />
                </button>
            </div>
            <Chart chartData={miniData} fullView={false} />

            {/* Fullscreen Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity- z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Full Chemical Dosage Chart</h2>
                            <button
                                className="text-lg text-black"
                                onClick={() => setIsOpen(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <Chart chartData={data} fullView={true} />
                    </div>
                </div>
            )}
        </div>
    )
}

