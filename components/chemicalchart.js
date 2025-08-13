'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Label, Rectangle } from 'recharts';
import { FiMaximize } from 'react-icons/fi';
import { FaFileDownload } from "react-icons/fa";
import React, { useState, useEffect, useRef } from 'react';
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
  const router = useRouter()
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


  // zoom / pan state
  const [fullData, setFullData] = useState([]); // complete transformed series
  const [visibleData, setVisibleData] = useState([]); // currently displayed slice
  const [zoomWindow, setZoomWindow] = useState({ startIdx: 0, endIdx: -1 }); // indices into fullData

  // refs for panning + preview
  const containerRef = useRef(null);
  const isPanningRef = useRef(false);
  const panStartX = useRef(0);
  const panStartWindow = useRef({ startIdx: 0, endIdx: -1 });
  const panPreviewRef = useRef({ startIdx: 0, endIdx: -1 }); // preview while dragging

  // small state just to toggle cursor during drag (only toggles at start/end)
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

  // When timeSeries (and therefore series) changes, regenerate transformed fullData and reset zoom window
  const transformed = transformSeries(series);
  useEffect(() => {
    setFullData(transformed);
    setVisibleData(transformed);
    if (transformed.length > 0) {
      setZoomWindow({ startIdx: 0, endIdx: transformed.length - 1 });
      panPreviewRef.current = { startIdx: 0, endIdx: transformed.length - 1 };
    } else {
      setZoomWindow({ startIdx: 0, endIdx: -1 });
      panPreviewRef.current = { startIdx: 0, endIdx: -1 };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(series)]); // deep watch series changes

  // Helper clamp
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Reset zoom to full range
  const resetZoom = () => {
    setVisibleData(fullData);
    if (fullData.length > 0) {
      setZoomWindow({ startIdx: 0, endIdx: fullData.length - 1 });
      panPreviewRef.current = { startIdx: 0, endIdx: fullData.length - 1 };
    } else {
      setZoomWindow({ startIdx: 0, endIdx: -1 });
      panPreviewRef.current = { startIdx: 0, endIdx: -1 };
    }
  };

  // Panning handlers (click + drag) — preview only during drag; apply on mouseup
  const handleMouseDown = (e) => {
    if (!fullData || fullData.length === 0) return;
    isPanningRef.current = true;
    panStartX.current = e.clientX;
    panStartWindow.current = { ...zoomWindow };
    panPreviewRef.current = { ...zoomWindow };
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isPanningRef.current || !fullData || fullData.length === 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = e.clientX - panStartX.current;
    const width = rect.width || 1;
    const { startIdx, endIdx } = panStartWindow.current;
    const rangeLen = endIdx - startIdx + 1;

    const shift = Math.round((-dx / width) * rangeLen);
    const fullLen = fullData.length;
    let newStart = panStartWindow.current.startIdx + shift;
    newStart = clamp(newStart, 0, Math.max(0, fullLen - rangeLen));
    let newEnd = newStart + rangeLen - 1;

    panPreviewRef.current = { startIdx: newStart, endIdx: newEnd };
    // We intentionally avoid setVisibleData here to prevent frequent re-renders during mousemove
  };

  const finalizePan = () => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    setIsDragging(false);
    const { startIdx, endIdx } = panPreviewRef.current;
    setZoomWindow({ startIdx, endIdx });
    setVisibleData(fullData.slice(startIdx, endIdx + 1));
  };

  const handleMouseUp = () => {
    finalizePan();
  };

  useEffect(() => {
    const handleUp = () => finalizePan();
    window.addEventListener('mouseup', handleUp);
    return () => window.removeEventListener('mouseup', handleUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullData]);

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
    if (!fullData || fullData.length === 0) return;
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
    if (!isTouchingRef.current || !fullData || fullData.length === 0) return;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const fullLen = fullData.length;

    if (e.touches.length === 1) {
      // Panning logic
      const dx = e.touches[0].clientX - touchStartX.current;
      const width = rect.width || 1;
      const { startIdx, endIdx } = touchStartWindow.current;
      const rangeLen = endIdx - startIdx + 1;
      const shift = Math.round((-dx / width) * rangeLen);

      let newStart = touchStartWindow.current.startIdx + shift;
      newStart = clamp(newStart, 0, Math.max(0, fullLen - rangeLen));
      let newEnd = newStart + rangeLen - 1;

      touchPreviewRef.current = { startIdx: newStart, endIdx: newEnd };
      setVisibleData(fullData.slice(newStart, newEnd + 1));
    } else if (e.touches.length === 2) {
      // Pinch-to-zoom logic
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
      setVisibleData(fullData.slice(newStart, newEnd + 1));
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
      if (!fullData || fullData.length === 0) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = e.clientX ?? (e.nativeEvent && e.nativeEvent.clientX);
      const offsetX = clamp(clientX - rect.left, 0, rect.width);
      const width = rect.width || 1;

      const { startIdx, endIdx } = zoomWindow;
      const fullLen = fullData.length;
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
      setVisibleData(fullData.slice(newStart, newEnd + 1));
      panPreviewRef.current = { startIdx: newStart, endIdx: newEnd };
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [fullData, zoomWindow, setVisibleData, setZoomWindow, clamp]);


  // Keep visibleData synced when zoomWindow changes
  useEffect(() => {
    const { startIdx, endIdx } = zoomWindow;
    if (!fullData || fullData.length === 0) return;
    if (startIdx <= endIdx && startIdx >= 0 && endIdx < fullData.length) {
      setVisibleData(fullData.slice(startIdx, endIdx + 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(zoomWindow), fullData]);

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

  // Chart renderer (uses visibleData)
  const Chart = ({ data, fullView, view }) => (
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
        height: '85 %',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}

    >
      <ResponsiveContainer width="95%" height="100%">
        <BarChart data={data}>
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
            labelFormatter={(ts) => new Date(ts).toLocaleString()}
            cursor={false}
          />
          <Legend />
          {series.map((s, idx) => (
            <Bar
              key={s.label}
              dataKey={s.label}
              fill={COLORS[idx % COLORS.length]}
              fillOpacity={0.8}
              activeBar={<Rectangle fill={COLORS[idx % COLORS.length]} fillOpacity={1} />}
              radius={8}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
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
          <button onClick={resetZoom} className="border px-2 py-1 rounded">Reset Zoom</button>
          <button onClick={() => downloadCSV(fullData, title, view)} title="Download DataFile" className="cursor-pointer">
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
        <Chart data={visibleData} fullView={false} view={view} />
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