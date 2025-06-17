'use client';
import { LineChart, Line, XAxis, YAxis,Label, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { flowRateHourly, flowRateDaily, flowRateWeekly } from '@/libs/data';
import { FiMaximize } from "react-icons/fi";
import { useState } from "react";

export default function FlowRaterChart({ view }) {
    const [isOpen, setIsOpen] = useState(false);

    const getChartData = () => {
        switch (view) {
            case 'hourly': return { data: flowRateHourly, xKey: 'hour' };
            case 'daily': return { data: flowRateDaily, xKey: 'day' };
            case 'weekly': return { data: flowRateWeekly, xKey: 'week' };
            default: return { data: [], xKey: '' };
        }
    };

    const { data, xKey } = getChartData();
    const miniData = data.slice(-12);

    const Chart = ({ chartData, fullView }) => (
        <ResponsiveContainer width="100%" height={fullView ? 300 : 150}>
            <LineChart data={chartData}>
                <XAxis dataKey={xKey} margin={{ left: 20, right: 20 }} />
                <YAxis >
                    <Label value="Ltr/hr" angle={-90} position="insideLeft" dy={20} textAnchor='middle' fill='#000' />
                </YAxis>
                <Tooltip />
                <Legend />
                <Line dataKey="inlet" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="outlet" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
        </ResponsiveContainer>
    );

    return (
        <div className="bg-white h-48 w-full rounded-md shadow-md">
            <div className="flex items-center justify-between px-2 py-1">
                <p className="text-lg font-medium">Water Flow Rate</p>
                <button onClick={() => setIsOpen(true)} title="Fullscreen">
                    <FiMaximize />
                </button>
            </div>

            <Chart chartData={miniData} fullView={false} />

            {isOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-70 z-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Full Water Flow Rate Chart</h2>
                            <button className="text-lg text-black" onClick={() => setIsOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <Chart chartData={data} fullView={true} />
                    </div>
                </div>
            )}
        </div>
    );
}
