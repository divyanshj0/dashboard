'use client';
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6366F1'];

const PieChartWidget = ({ parameters = [], token, label = "", onLatestTimestampChange }) => {
  const router = useRouter();
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPieData = async () => {
      setLoading(true);
      setError(null);
      let latestTimestamp = 0;
      try {
        if (!parameters.length || !token) throw new Error('Missing parameters or token');
        // Fetch for all parameters
        const values = [];
        for (let [i, param] of parameters.entries()) {
          const res = await fetch('/api/thingsboard/timeseriesdata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              deviceId: param.deviceId,
              key: param.key,
              limit: 1, // latest only
            }),
          });

          if (res.status === 401) {
            localStorage.clear();
            toast.error('Session expired. Please log in again.');
            router.push('/');
            return;
          }
          if (!res.ok) throw new Error(`API request failed: ${res.status}`);

          const data = await res.json();
          const value = Number(data[param.key]?.[0]?.value ?? 0);
          const ts = Number(data[param.key]?.ts ?? 0);
          if (ts > latestTimestamp) latestTimestamp = ts;
          values.push({
            name: param.label || param.key || `Slice ${i+1}`,
            value,
            itemStyle: { color: COLORS[i % COLORS.length] },
          });
        }

        setPieData(values);
        if (latestTimestamp > 0 && typeof onLatestTimestampChange === 'function') {
          onLatestTimestampChange(latestTimestamp);
        }
      } catch (err) {
        setError(err.message);
        setPieData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPieData();
  }, [parameters, token]);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center'
    },
    series: [
      {
        name: label || 'Value',
        type: 'pie',
        radius: [40, 60],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: '#333'
        },
        labelLine: { show: false },
        data: pieData
      }
    ]
  };

  return (
    <div className="h-full w-full bg-white flex flex-col justify-center items-center border border-gray-200 rounded-md shadow-sm p-2">
      <div className="text-md font-medium text-gray-700 text-center mb-1">{label}</div>
      {loading ? (
        <div className="h-[180px] w-[180px] flex items-center justify-center">
          <span className="text-gray-500">Loading...</span>
        </div>
      ) : error ? (
        <div className="h-[180px] w-[180px] flex items-center justify-center">
          <span className="text-red-500 text-sm">Error</span>
        </div>
      ) : (
        <div className="relative h-[180px] w-[180px]">
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

export default PieChartWidget;
