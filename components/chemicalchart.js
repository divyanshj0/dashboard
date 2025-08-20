'use client';
import ReactECharts from 'echarts-for-react';
import { FiMaximize } from 'react-icons/fi';
import { FaFileDownload } from "react-icons/fa";
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
const COLORS = ["#2bc864", "#3f92de", "#d4a822", "#ce604f", "#966edf", "#cd6493", "#5f7cda"];

function transformSeries(series) {
  const allPoints = {};

  series.forEach(s => {
    s.data.forEach(({ ts, value }) => {
      const minuteTimestamp = Math.floor(Number(ts) / (1000 * 60)) * (1000 * 60);

      if (!allPoints[minuteTimestamp]) {
        allPoints[minuteTimestamp] = { ts: minuteTimestamp };
      }
      if (allPoints[minuteTimestamp][s.label] !== undefined) {
        allPoints[minuteTimestamp][s.label] = (allPoints[minuteTimestamp][s.label] + value) / 2;
      } else {
        allPoints[minuteTimestamp][s.label] = value;
      }
    });
  });

  return Object.values(allPoints).sort((a, b) => a.ts - b.ts);
}

function downloadCSV(data, title, view) {
  if (!data || !data.length) return;

  const formattedData = data.map(row => {
    const dateObj = new Date(row.ts);
    const dateString = dateObj.toLocaleDateString();
    const timeString = dateObj.toLocaleTimeString();

    const newRow = { ...row };
    delete newRow.ts;
    return {
      Date: dateString,
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

export default function ChemicalChart({ title = "", parameters = [], token, saveLayout, unit, onLatestTimestampChange }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('hourly');
  const [timeSeries, setTimeSeries] = useState({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [isCustomRangeApplied, setIsCustomRangeApplied] = useState(false);
  const [displayedStartDate, setDisplayedStartDate] = useState('');
  const [displayedEndDate, setDisplayedEndDate] = useState('');

  const containerRef = useRef(null);

  // Fetch time series data as before
  const fetchTimeSeriesData = async () => {
    setLoading(true);
    const result = {};
    let latestTimestamp = 0;
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
        startTs = now - (1000 * 60 * 60 * 24 * 7);
        endTs = now;
      }

      for (const param of parameters) {
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

        if (res.status === 401) {
          localStorage.clear();
          toast.error('Session expired. Please log in again.');
          router.push('/');
          return;
        }

        const data = await res.json();
        const dataForParam = Array.isArray(data[param.key])
          ? data[param.key].map((item) => {
            const ts = Number(item.ts);
            if (ts > latestTimestamp) latestTimestamp = ts;
            return {
              ts: ts,
              value: parseFloat(item.value),
            };
          })
          : [];
        result[`${param.deviceId}_${param.key}`] = dataForParam;
      }

      setTimeSeries(result);
      if (latestTimestamp > 0 && typeof onLatestTimestampChange === 'function') {
        onLatestTimestampChange(latestTimestamp);
      }
    } catch (error) {
      console.error('Failed to fetch time series data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (parameters.length > 0 && token) {
      if (view === 'custom' && !isCustomRangeApplied) {
        // Do not fetch until "Go" is clicked
        return;
      }
      fetchTimeSeriesData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameters, token, view, isCustomRangeApplied]);

  // Build series as before (keeps labels & units)
  const getSeriesData = (key, deviceId) => timeSeries[`${deviceId}_${key}`] || [];

  const series = parameters.map((p) => ({
    data: getSeriesData(p.key, p.deviceId),
    value: getSeriesData(p.key, p.deviceId)?.slice(-1)[0]?.value || null,
    label: p.label || p.key,
    unit: unit || '',
  }));

  // Transform series for chart
  const chartData = transformSeries(series);

  const handleViewChange = (newView) => {
    setView(newView);
    if (newView === 'custom') {
      setShowCustomInputs(true);
      setIsCustomRangeApplied(false);
    } else {
      setShowCustomInputs(false);
      setStartDate('');
      setEndDate('');
      setIsCustomRangeApplied(false);
      setDisplayedStartDate('');
      setDisplayedEndDate('');
      fetchTimeSeriesData();
    }
  };

  const handleCustomRangeSubmit = () => {
    if (startDate && endDate) {
      setIsCustomRangeApplied(true);
      setShowCustomInputs(false);
      setDisplayedStartDate(startDate);
      setDisplayedEndDate(endDate);
    }
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1');
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


  // --- Chart rendering with ECharts ---
  const Chart = ({ data, fullView }) => {
    const xAxisLabels = data.map(item => {
      const date = new Date(item.ts);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    });

    // Build a map from label string to index so series data can link to category axis
    const labelToIndex = {};
    xAxisLabels.forEach((label, idx) => {
      labelToIndex[label] = idx;
    });

    // Transform series data to be array of [categoryIndex, value]
    const echartSeries = series.map((s, idx) => ({
      name: s.label,
      type: 'bar', // or 'line' depending on your chart
      data: data.map(item => {
        const label = new Date(item.ts).toLocaleString('en-GB', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
        });
        return [labelToIndex[label], item[s.label]];
      }),
      barMaxWidth: 28,
      itemStyle: { color: COLORS[idx % COLORS.length] }
    }));


    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function (params) {
          if (!params.length) return '';
          const ts = params[0].data[0];
          const date = new Date(ts);
          let str = date.toLocaleString('en-GB', {
            year: '2-digit', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
          }) + '<br />';
          params.forEach(p => {
            str += `<span style="display:inline-block;width:8px;height:8px;margin-right:5px;background:${p.color};border-radius:1px"></span> ${p.seriesName}: ${p.data[1] ?? '-'}<br/>`;
          });
          return str;
        }
      },
      legend: {
        data: series.map(s => s.label),
        bottom: 0,
        left: 'center',
        orient: 'horizontal'
      },
      grid: {
        top: 20,
        left: 60,
        right: 30,
        bottom: 40
      },
      xAxis: {
        type: 'category',
        data: xAxisLabels,
        axisLine: { show: true },
        axisTick: { show: true }
      },
      yAxis: {
        type: 'value',
        name: unit || 'Value',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { fontSize: 18 },
        position: 'left',
        axisLine: { show: true },
        splitLine: { show: false }
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 }
      ],
      series: echartSeries
    };

    return (
      <div style={{ width: '100%', height: '85%' }}>
        <ReactECharts
          option={option}
          style={{ width: '95%', height: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={true}
          ref={containerRef}
        />
      </div>
    );
  };

  return (
    <div className="bg-white h-full w-full border border-gray-200 rounded-md shadow-sm p-4">
      {/* Header + selector */}
      <div className="flex items-center justify-between">
        <p className="text-xl font-semibold">{title}</p>
        <div className={`${saveLayout ? 'hidden' : 'flex'} items-center gap-3`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewChange('hourly')}
              aria-pressed={view === 'hourly'}
              className={`px-4 py-2 rounded-sm font-medium shadow-sm transition-shadow duration-150 ${view === 'hourly' ? 'bg-blue-600 text-white ring-2 ring-blue-100' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              D
            </button>
            <button
              onClick={() => handleViewChange('weekly')}
              aria-pressed={view === 'weekly'}
              className={`px-4 py-2 rounded-sm font-medium shadow-sm transition-shadow duration-150 ${view === 'weekly' ? 'bg-blue-600 text-white ring-2 ring-blue-100' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              W
            </button>
            <button
              onClick={() => handleViewChange('custom')}
              aria-pressed={view === 'custom'}
              className={`px-4 py-2 rounded-sm font-medium shadow-sm transition-shadow duration-150 ${view === 'custom' ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              C
            </button>
          </div>
          <button onClick={() => downloadCSV(chartData, title, view)} title="Download DataFile" className="cursor-pointer">
            <FaFileDownload size={20} />
          </button>
          <button onClick={() => setIsOpen(true)} title="fullscreen" className="cursor-pointer">
            <FiMaximize size={20} />
          </button>
        </div>
      </div>

      {/* History Line */}
      {view === 'custom' && isCustomRangeApplied && displayedStartDate && displayedEndDate && (
        <p className="mt-2 text-md text-gray-500">
          History - from {formatTimestamp(displayedStartDate)} to {formatTimestamp(displayedEndDate)}
        </p>
      )}

      {/* Date inputs card */}
      {showCustomInputs && (
        <div className="w-full h-[100px] my-2 max-w-4xl bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
          <div className="flex w-full gap-4 items-end">
            <div className='w-[50%]'>
              <label className="text-sm font-semibold text-gray-700">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 w-full border rounded-md p-3 bg-white"
                aria-label="Start date"
                max={endDate || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className='w-[50%]'>
              <label className="text-sm font-semibold text-gray-700">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2 w-full border rounded-md p-3 bg-white"
                aria-label="End date"
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="">
              <button
                onClick={handleCustomRangeSubmit}
                disabled={!startDate || !endDate}
                className={`px-4 py-2 rounded-md text-sm ${(!startDate || !endDate) ? 'bg-blue-200 text-white cursor-not-allowed' : 'bg-blue-600 text-white'}`}
              >
                Go
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-full flex items-center justify-center">
          <p>Loading data...</p>
        </div>
      ) : view === 'custom' && !isCustomRangeApplied ? (
        <div className="h-full flex items-center justify-center text-gray-500">
          <p>Please select a time range and click "Go".</p>
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