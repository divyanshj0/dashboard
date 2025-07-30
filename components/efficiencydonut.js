'use client';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { useState, useEffect } from 'react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B']; // Blue, Green, Amber

const Efficiency = ({ parameters = [], token, label = "" }) => {
  const [latestValue, setLatestValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestValue = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!parameters.length || !token) {
          throw new Error('Missing parameters or token');
        }
        // Get the first parameter (assuming single value for efficiency)
        const param = parameters[0];
        const res = await fetch('/api/thingsboard/timeseriesdata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            deviceId: param.deviceId,
            key: param.key,
            limit: 1, // Only get the latest value
          }),
        });

        if (!res.ok) {
          throw new Error(`API request failed: ${res.status}`);
        }

        const data = await res.json();
        const value = data[param.key]?.[0]?.value;

        setLatestValue(value ? parseFloat(value) : 0);
      } catch (err) {
        console.error('Error fetching efficiency data:', err);
        setError(err.message);
        setLatestValue(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestValue();
  }, [parameters, token]);

  // Ensure value is between 0-100
  const displayValue = Math.min(Math.max(latestValue, 0), 100);
  const formattedValue = displayValue.toFixed(2);
  const chartData = [{
    name: 'Efficiency',
    value: formattedValue,
    fill: COLORS[0], // Use first color
  }];

  return (
    <div className="h-full w-full bg-white flex flex-col justify-center items-center border border-gray-200 rounded-md shadow-sm p-2">
      <div className="text-md font-medium text-gray-700 text-center mb-1">
        {label}
      </div>
      
      {loading ? (
        <div className="h-[120px] w-[120px] flex items-center justify-center">
          <span className="text-gray-500">Loading...</span>
        </div>
      ) : error ? (
        <div className="h-[120px] w-[120px] flex items-center justify-center">
          <span className="text-red-500 text-sm">Error</span>
        </div>
      ) : (
        <div className="relative h-[120px] w-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="90%"
              barSize={12}
              data={chartData}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis 
                type="number" 
                domain={[0, 100]} 
                angleAxisId={0} 
                tick={false} 
              />
              <RadialBar
                angleAxisId={0}
                cornerRadius={4}
                background
                clockWise
                dataKey="value"
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-gray-800">
              {formattedValue}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Efficiency;