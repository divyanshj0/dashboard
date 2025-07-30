'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { FiMaximize } from 'react-icons/fi';
import { FaFileDownload } from "react-icons/fa";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6366F1"];

function transformSeries(series) {
  const allTimestamps = new Set();
  const rawDataAtTimestamps = {};
  series.forEach(s => {
    s.data.forEach(({ ts, value }) => {
      const numericTs = Number(ts);
      allTimestamps.add(numericTs);

      if (!rawDataAtTimestamps[numericTs]) {
        rawDataAtTimestamps[numericTs] = {};
      }
      rawDataAtTimestamps[numericTs][s.label] = value;
    });
  });

  const allLabels = series.map(s => s.label);
  const chartData = [];
  Array.from(allTimestamps).sort((a, b) => a - b).forEach(ts => {
    const entry = { ts: ts };

    allLabels.forEach(label => {
      entry[label] = rawDataAtTimestamps[ts][label] !== undefined ? rawDataAtTimestamps[ts][label] : null;
    });
    chartData.push(entry);
  });
  return chartData;
}

function downloadCSV(data, title, view) {
  if (!data.length) return;

  const formattedData = data.map(row => {
    const dateObj = new Date(row.ts);

    // Format day as DD:MM:YY
    const dayString = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      year: '2-digit',
      month: '2-digit',
    });
    // Format time as HH:MM:SS (24-hour format)
    const timeString = dateObj.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const newRow = { ...row };
    delete newRow.ts;
    delete newRow.time;

    return {
      'Date': dayString,
      Time: timeString,
      ...newRow
    };
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

export default function TreatedWaterChart({ title = "", parameters = [], token, saveLayout }) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('hourly');
  const [timeSeries, setTimeSeries] = useState({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const[showCustomField,setShowCustomField]=useState(false)
  const fetchTimeSeriesData = async () => {
    setLoading(true);
    const result = {};
    
    try {
      let startTs, endTs;
      const now = Date.now();

      if (view === 'hourly') {
        startTs = now - (1000 * 60 * 60 * 24); // 1 day ago
        endTs = now;
      } else if (view === 'weekly') {
        startTs = now - (1000 * 60 * 60 * 24 * 7); // 7 days ago
        endTs = now;
      } else if (view === 'custom' && startDate && endDate) {
        startTs = new Date(startDate).getTime();
        endTs = new Date(endDate).getTime();
      } else {
        // Default to weekly if custom dates aren't set
        startTs = now - (1000 * 60 * 60 * 24 * 7);
        endTs = now;
      }

      for (const param of parameters) {
        const compositeKey = `${param.deviceId}_${param.key}`;
        
        const res = await fetch('/api/thingsboard/timeseriesdata', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            deviceId: param.deviceId,
            key: param.key,
            limit: 10000,
            startTs: startTs,
            endTs: endTs,
          }),
        });

        const data = await res.json();

        result[compositeKey] = Array.isArray(data[param.key])
          ? data[param.key].map((item) => ({
              ts: Number(item.ts),
              value: parseFloat(item.value),
            }))
          : [];
      }
      
      setTimeSeries(result);
    } catch (error) {
      console.error('Failed to fetch time series data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (parameters.length > 0 && token) {
      fetchTimeSeriesData();
    }
  }, [parameters, token, view, startDate, endDate]);

  const getSeriesData = (key, deviceId) => {
    const flatKey = `${deviceId}_${key}`;
    return timeSeries[flatKey] || [];
  };

  const series = parameters.map((p) => ({
    data: getSeriesData(p.key, p.deviceId),
    value: getSeriesData(p.key, p.deviceId)?.slice(-1)[0]?.value || null,
    label: p.label || p.key,
    unit: p.unit || '',
  }));

  const chartData = transformSeries(series);
  const handleViewChange = (newView) => {
    setView(newView);

    if (newView === 'custom') {
      setShowCustomInputs(true);
      setShowCustomField(true);
    } else {
      setShowCustomInputs(false);
      setStartDate('');
      setEndDate('');
      fetchTimeSeriesData();
    }
  };

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
            return date.toLocaleString('en-GB',{
              day:'2-digit',
              month:'2-digit',
              hour:'2-digit',
              minute:'2-digit',
              hour12:false,
            });
          }}
        />
        <YAxis>
          <Label value={series[0]?.unit || 'Value'} angle={-90} offset={15} fontSize={20} position="insideLeft" />
        </YAxis>
        <Tooltip
          labelFormatter={(ts) =>
            new Date(ts).toLocaleString('en-GB', {
              year: '2-digit',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })
          }
          cursor={false}
        />
        <Legend/>
        {series.map((s, idx) => (
            <Line
              type="monotone"
              key={s.label}
              dataKey={s.label}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={3}
              dot={fullView?{ r: 4 }:{r:0}}
              connectNulls={true}
              isAnimationActive={false}
            />
          )
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <div className="bg-white h-full w-full border-gray-200 rounded-md shadow-sm">
      <div className="flex items-center justify-between px-2 pt-1">
        <p className="text-lg font-medium">{title}</p>
        <div className={`${saveLayout ? 'hidden' : 'flex gap-5 items-center'} pt-1`}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleViewChange('hourly')}
              aria-label="Daily view"
              className={`w-8 h-8 flex items-center justify-center rounded border ${view === 'hourly' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                } ${showCustomField?'hidden':''}`}
            >
              D
            </button>
            <button
              onClick={() => handleViewChange('weekly')}
              aria-label="Weekly view"
              className={`w-8 h-8 flex items-center justify-center rounded border ${view === 'weekly' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                } ${showCustomField?'hidden':''}`}
            >
              W
            </button>
            <button
              onClick={() => handleViewChange('custom')}
              aria-label="Custom date range"
              className={`w-8 h-8 flex items-center justify-center rounded border ${showCustomInputs ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                }`}
            >
              C
            </button>
            {showCustomField && (
              <div className="flex items-center gap-2 ml-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border rounded p-1 text-sm"
                  aria-label="Start date"
                  max={endDate || new Date().toISOString().split('T')[0]}
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border rounded p-1 text-sm"
                  aria-label="End date"
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                />
                <button
                  onClick={()=>{setShowCustomField(false)}}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                  aria-label="Apply custom date range"
                >
                  Go
                </button>
              </div>
            )}
          </div>
          
          <button onClick={() => downloadCSV(chartData, title, view)} title="Download DataFile" className='cursor-pointer' >
            <FaFileDownload size={20}/>
          </button>
          <button onClick={() => setIsOpen(true)} title="fullscreen" className='cursor-pointer'>
            <FiMaximize size={20} />
          </button>
        </div>
      </div>
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <p>Loading data...</p>
        </div>
      ) : (
        <Chart data={chartData} fullView={false} />
      )}
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