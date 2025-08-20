'use client';
import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
const COLORS = ['#3B82F6', '#10B981', '#F59E0B']; // Blue, Green, Amber

const Efficiency = ({ parameters = [], token, label = "" ,onLatestTimestampChange}) => {
  const router=useRouter()
  const [latestValue, setLatestValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLatestValue = async () => {
    setLoading(true);
    setError(null);
    let latestTimestamp = 0;
    try {
      if (!parameters.length || !token) {
        throw new Error('Missing parameters or token');
      }
      // Use first parameter
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
          limit: 1, // get latest
        }),
      });

      if (res.status === 401) {
        localStorage.clear();
        toast.error('Session expired. Please log in again.');
        router.push('/');
        return;
      }
      if (!res.ok) {
        throw new Error(`API request failed: ${res.status}`);
      }

      const data = await res.json();
      const value = data[param.key]?.[0]?.value;
      const ts = Number(data[param.key]?.[0]?.ts);
      if (ts > latestTimestamp) latestTimestamp = ts;

      setLatestValue(value ? parseFloat(value) : 0);
      if (latestTimestamp > 0 && typeof onLatestTimestampChange === 'function') {
        onLatestTimestampChange(latestTimestamp);
      }
    } catch (err) {
      console.error('Error fetching efficiency data:', err);
      setError(err.message);
      setLatestValue(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestValue();
  }, [parameters, token]);

  const displayValue = Math.min(Math.max(latestValue, 0), 100);
  const formattedValue = displayValue.toFixed(2);

  // ECharts option for radial bar resembling your Recharts radial bar chart
  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        progress: {
          show: true,
          roundCap: true,
          width: 12,
          itemStyle: { color: COLORS[0] }
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, '#e6e6e6']] // background track color
          }
        },
        pointer: {
          show: false
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          formatter: '{value}%',
          color: '#333',
          fontSize: 16,
          offsetCenter: [0, 0],
        },
        data: [{ value: displayValue }]
      }
    ]
  };

  return (
    <div className="h-full w-full bg-white flex flex-col justify-center items-center border border-gray-200 rounded-md shadow-sm p-2">
      <div className="text-md font-medium text-gray-700 text-center mb-1">{label}</div>

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
          <ReactECharts
            option={option}
            style={{ width: '100%', height: '100%' }}
            opts={{ renderer: 'svg' }}
            lazyUpdate={true}
          />
        </div>
      )}
    </div>
  );
};

export default Efficiency;
