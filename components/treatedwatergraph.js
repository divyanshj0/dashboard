'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { FiMaximize } from 'react-icons/fi';
import { FaFileDownload } from "react-icons/fa";
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
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
  if (!data || !data.length) return;

  const formattedData = data.map(row => {
    const dateObj = new Date(row.ts);

    const dayString = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      year: '2-digit',
      month: '2-digit',
    });
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

export default function TreatedWaterChart({ title = "", parameters = [], token, unit, saveLayout, onLatestTimestampChange }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('hourly');
  const [timeSeries, setTimeSeries] = useState({});
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [isCustomRangeApplied, setIsCustomRangeApplied] = useState(false);

  // --- Zoom / Pan State (indices into fullChartData) ---
  const [fullChartData, setFullChartData] = useState([]);
  const [visibleData, setVisibleData] = useState([]);
  const [zoomWindow, setZoomWindow] = useState({ startIdx: 0, endIdx: -1 });

  // refs for panning preview and interactions
  const containerRef = useRef(null);
  const isPanningRef = useRef(false);
  const panStartX = useRef(0);
  const panStartWindow = useRef({ startIdx: 0, endIdx: -1 });
  const panPreviewRef = useRef({ startIdx: 0, endIdx: -1 });
  const [isDragging, setIsDragging] = useState(false);

  // New refs for touch state
  const isTouchingRef = useRef(false);
  const touchStartX = useRef(0);
  const touchStartDist = useRef(0);
  const touchStartWindow = useRef({ startIdx: 0, endIdx: -1 });
  const touchPreviewRef = useRef({ startIdx: 0, endIdx: -1 });

  const fetchTimeSeriesData = async () => {
    setLoading(true);
    const result = {};
    let latestTimestamp = 0;
    try {
      let startTs, endTs;
      const now = Date.now();

      if (view === 'hourly') {
        startTs = now - (1000 * 60 * 60 * 24);
        endTs = now;
      } else if (view === 'weekly') {
        startTs = now - (1000 * 60 * 60 * 24 * 7);
        endTs = now;
      } else if (view === 'custom' && startDate && endDate) {
        startTs = new Date(startDate).getTime();
        endTs = new Date(endDate).getTime();
      } else {
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
            if (ts > latestTimestamp) {
              latestTimestamp = ts;
            }
            return {
              ts: ts,
              value: parseFloat(item.value),
            };
          })
          : [];
        result[compositeKey] = dataForParam;
      }

      setTimeSeries(result);
      if (latestTimestamp > 0) {
        if (typeof onLatestTimestampChange === 'function') onLatestTimestampChange(latestTimestamp);
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

  const getSeriesData = (key, deviceId) => {
    const flatKey = `${deviceId}_${key}`;
    return timeSeries[flatKey] || [];
  };

  const series = parameters.map((p) => ({
    data: getSeriesData(p.key, p.deviceId),
    value: getSeriesData(p.key, p.deviceId)?.slice(-1)[0]?.value || null,
    label: p.label || p.key,
    unit: unit || '',
  }));

  const chartData = transformSeries(series);

  useEffect(() => {
    setFullChartData(chartData);
    setVisibleData(chartData);
    if (chartData.length > 0) {
      setZoomWindow({ startIdx: 0, endIdx: chartData.length - 1 });
      panPreviewRef.current = { startIdx: 0, endIdx: chartData.length - 1 };
    } else {
      setZoomWindow({ startIdx: 0, endIdx: -1 });
      panPreviewRef.current = { startIdx: 0, endIdx: -1 };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(chartData)]);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const resetZoom = () => {
    setVisibleData(fullChartData);
    if (fullChartData.length > 0) {
      setZoomWindow({ startIdx: 0, endIdx: fullChartData.length - 1 });
      panPreviewRef.current = { startIdx: 0, endIdx: fullChartData.length - 1 };
    } else {
      setZoomWindow({ startIdx: 0, endIdx: -1 });
      panPreviewRef.current = { startIdx: 0, endIdx: -1 };
    }
  };

  const handleMouseDown = (e) => {
    if (!fullChartData || fullChartData.length === 0) return;
    isPanningRef.current = true;
    panStartX.current = e.clientX;
    panStartWindow.current = { ...zoomWindow };
    panPreviewRef.current = { ...zoomWindow };
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isPanningRef.current || !fullChartData || fullChartData.length === 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = e.clientX - panStartX.current;
    const width = rect.width || 1;
    const { startIdx, endIdx } = panStartWindow.current;
    const rangeLen = endIdx - startIdx + 1;

    const shift = Math.round((-dx / width) * rangeLen);
    const fullLen = fullChartData.length;
    let newStart = panStartWindow.current.startIdx + shift;
    newStart = clamp(newStart, 0, Math.max(0, fullLen - rangeLen));
    let newEnd = newStart + rangeLen - 1;

    panPreviewRef.current = { startIdx: newStart, endIdx: newEnd };
  };

  const finalizePan = () => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    setIsDragging(false);
    const { startIdx, endIdx } = panPreviewRef.current;
    setZoomWindow({ startIdx, endIdx });
    setVisibleData(fullChartData.slice(startIdx, endIdx + 1));
  };

  const handleMouseUp = () => {
    finalizePan();
  };

  useEffect(() => {
    const handleUp = () => finalizePan();
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullChartData]);

  // Touch handlers
  const getTouchDistance = (e) => {
    if (e.touches.length < 2) return null;
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e) => {
    if (!fullChartData || fullChartData.length === 0) return;
    e.preventDefault();
    isTouchingRef.current = true;
    touchStartWindow.current = { ...zoomWindow };
    touchPreviewRef.current = { ...zoomWindow };

    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
    } else if (e.touches.length === 2) {
      touchStartDist.current = getTouchDistance(e);
    }
  };

  const handleTouchMove = (e) => {
    if (!isTouchingRef.current || !fullChartData || fullChartData.length === 0) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fullLen = fullChartData.length;

    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStartX.current;
      const width = rect.width || 1;
      const { startIdx, endIdx } = touchStartWindow.current;
      const rangeLen = endIdx - startIdx + 1;
      const shift = Math.round((-dx / width) * rangeLen);

      let newStart = touchStartWindow.current.startIdx + shift;
      newStart = clamp(newStart, 0, Math.max(0, fullLen - rangeLen));
      let newEnd = newStart + rangeLen - 1;

      touchPreviewRef.current = { startIdx: newStart, endIdx: newEnd };
      setVisibleData(fullChartData.slice(newStart, newEnd + 1));
    } else if (e.touches.length === 2) {
      const currentDist = getTouchDistance(e);
      if (currentDist === null || touchStartDist.current === 0) return;
      const zoomFactor = touchStartDist.current / currentDist;

      const { startIdx, endIdx } = touchStartWindow.current;
      const rangeLen = endIdx - startIdx + 1;

      let newRange = Math.max(2, Math.round(rangeLen * zoomFactor));
      newRange = clamp(newRange, 2, fullLen);

      const touch1 = e.touches[0];
      const offsetX = clamp(touch1.clientX - rect.left, 0, rect.width);
      const mouseRatio = offsetX / rect.width;
      const targetIndex = startIdx + Math.floor(mouseRatio * (rangeLen - 1));

      let newStart = Math.round(targetIndex - mouseRatio * (newRange - 1));
      newStart = clamp(newStart, 0, fullLen - newRange);
      let newEnd = newStart + newRange - 1;

      touchPreviewRef.current = { startIdx: newStart, endIdx: newEnd };
      setVisibleData(fullChartData.slice(newStart, newEnd + 1));
    }
  };

  const handleTouchEnd = () => {
    if (!isTouchingRef.current) return;
    isTouchingRef.current = false;
    const { startIdx, endIdx } = touchPreviewRef.current;
    setZoomWindow({ startIdx, endIdx });
  };

  // Non-passive mouse wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      if (!fullChartData || fullChartData.length === 0) return;

      const rect = container.getBoundingClientRect();
      if (!rect) return;
      const clientX = e.clientX ?? (e.nativeEvent && e.nativeEvent.clientX);
      const offsetX = clamp(clientX - rect.left, 0, rect.width);
      const width = rect.width || 1;

      const { startIdx, endIdx } = zoomWindow;
      const fullLen = fullChartData.length;
      if (startIdx > endIdx || fullLen === 0) return;

      const rangeLen = endIdx - startIdx + 1;
      const mouseRatio = offsetX / width;
      const targetIndex = startIdx + Math.floor(mouseRatio * (rangeLen - 1));

      const zoomIn = e.deltaY < 0;
      const zoomFactor = zoomIn ? 0.75 : 1.25;
      let newRange = Math.max(2, Math.round(rangeLen * zoomFactor));

      newRange = clamp(newRange, 2, fullLen);

      let newStart = Math.round(targetIndex - mouseRatio * (newRange - 1));
      newStart = clamp(newStart, 0, fullLen - newRange);
      let newEnd = newStart + newRange - 1;

      setZoomWindow({ startIdx: newStart, endIdx: newEnd });
      setVisibleData(fullChartData.slice(newStart, newEnd + 1));
      panPreviewRef.current = { startIdx: newStart, endIdx: newEnd };
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [fullChartData, zoomWindow, setVisibleData, setZoomWindow, clamp]);

  // Keep visibleData synced when zoomWindow changes
  useEffect(() => {
    const { startIdx, endIdx } = zoomWindow;
    if (!fullChartData || fullChartData.length === 0) return;
    if (startIdx <= endIdx && startIdx >= 0 && endIdx < fullChartData.length) {
      setVisibleData(fullChartData.slice(startIdx, endIdx + 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(zoomWindow), fullChartData]);

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
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        height: fullView
          ? '90%'
          : (view === 'custom' ? 'calc(90% - 100px)' : '90%'),
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <ResponsiveContainer width="95%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="ts"
            tickFormatter={(ts) => {
              const date = new Date(ts);
              return date.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });
            }}
          />
          <YAxis>
            <Label value={unit || 'Value'} angle={-90} offset={15} fontSize={20} position="insideLeft" />
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
          <Legend />
          {series.map((s, idx) => (
            <Line
              type="monotone"
              key={s.label}
              dataKey={s.label}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={3}
              dot={fullView ? { r: 4 } : { r: 0 }}
              connectNulls={true}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

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
      {/* Date inputs card */}
      {showCustomInputs && (
        <div className="w-full my-2 max-w-4xl bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 shadow-sm">
          <div className="flex gap-4 items-end">
            <div className='w-[40%]'>
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
            <div className='w-[40%]'>
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
            <button
                onClick={() => { setIsCustomRangeApplied(true); }}
                disabled={!startDate || !endDate}
                className={`px-4 py-2 w-12 h-9 rounded-md text-sm ${(!startDate || !endDate) ? 'bg-blue-200 text-white cursor-not-allowed' : 'bg-blue-600 text-white'}`}
            >
                Go
            </button>
          </div>
        </div>
      )}
        {loading ? (
          <div className="h-56 flex items-center justify-center">
            <p>Loading data...</p>
          </div>
        ) : view === 'custom' && !isCustomRangeApplied ? (
          <div className="h-56 flex items-center justify-center text-red-500">
            <p>Please select both start and end dates for a custom range.</p>
          </div>
        ) : (
          <Chart data={visibleData} fullView={false} />
        )}
      {isOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center px-2">
          <div className="bg-white p-4 rounded-lg w-full max-w-[90vw] h-[90vh] overflow-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{title}</h2>
              <button onClick={() => setIsOpen(false)} className="text-lg">✕</button>
            </div>
            <Chart data={visibleData} fullView={true} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
