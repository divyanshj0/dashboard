// divyanshj0/dashboard/dashboard-e0d67ddeb452132cdd921b4a298401b3e8890e7d/components/WidgetRenderer.js
'use client';
import { useEffect, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import WaterProperty from './waterproperty';
import Efficiency from './efficiencydonut';
import EnergyEfficiency from './energyefficiency';
import TreatedWaterChart from './treatedwatergraph';
import FlowRaterChart from './flowratechart';
import ChemicalChart from './chemicalchart';
import ChemicalDosage from './chemicalDosage';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import ImageComponent from './Imagecomponent';

const ResponsiveGridLayout = WidthProvider(Responsive);
// const TB_URL = 'https://demo.thingsboard.io'; // No longer strictly needed if using publicLink

export default function WidgetRenderer({ config, layout, saveLayout, onLayoutSave, token, onLatestTimestampChange }) {
  const [timeSeries, setTimeSeries] = useState({});

  if (!config || !config.widgets || !Array.isArray(config.widgets)) return null;

  useEffect(() => {
    const fetchTimeSeriesForAllWidgets = async () => {
      const result = {};
      const endTs = Date.now();
      const startTs = endTs - (1000 * 60 * 60 * 24 * 7);
      let latestOverallTs = 0;

      for (const widget of config.widgets) {
        // Skip fetching time series for image widgets
        if (widget.type === 'image') {
          continue;
        }

        const parameters = widget.parameters || [];
        for (const param of parameters) {
          const compositeKey = `${param.deviceId}_${param.key}`;
          if (result[compositeKey]) continue;

          try {
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

            const fetchedData = Array.isArray(data[param.key])
              ? data[param.key].map((item) => ({
                  ts: Number(item.ts),
                  value: parseFloat(item.value),
                }))
              : [];

            result[compositeKey] = fetchedData;

            if (fetchedData.length > 0) {
              const currentLatest = Math.max(...fetchedData.map(d => d.ts));
              if (currentLatest > latestOverallTs) {
                latestOverallTs = currentLatest;
              }
            }

          } catch (error) {
            console.error(`Failed to fetch data for ${compositeKey}`, error);
            result[compositeKey] = [];
          }
        }
      }

      setTimeSeries(result);
      if (onLatestTimestampChange && latestOverallTs > 0) {
        onLatestTimestampChange(latestOverallTs);
      }
    };

    fetchTimeSeriesForAllWidgets();
  }, [config, token, onLatestTimestampChange]);

  const getValue = (key, deviceId) => {
    const flatKey = `${deviceId}_${key}`;
    const points = timeSeries[flatKey] || [];
    return points.length > 0 ? points[points.length - 1].value : null;
  };

  const getSeriesData = (key, deviceId) => {
    const flatKey = `${deviceId}_${key}`;
    return timeSeries[flatKey] || [];
  };

  return (
    <ResponsiveGridLayout
      className="layout overflow-visible"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
      rowHeight={100}
      isDraggable={saveLayout}
      isResizable={saveLayout}
      onLayoutChange={(newLayout) => {
        if (!saveLayout) return;
        if (onLayoutSave) onLayoutSave(newLayout);
      }}
    >
      {config.widgets.map((w, i) => {
        const key = w.id || w.name || `widget-${i}`;
        const parameters = Array.isArray(w.parameters) ? w.parameters : [];
        // Note: For image widgets, parameters structure is { imageId, publicLink, title }
        const series = parameters.map((p) => ({
          data: getSeriesData(p.key, p.deviceId),
          value: getValue(p.key, p.deviceId),
          label: p.label || p.key,
          unit: p.unit || '',
        }));

        return (
          <div key={key} className={`${saveLayout ? 'bg-white p-2' : ''} z-[1] rounded`}>
            {(() => {
              switch (w.type) {
                case 'donut':
                  return <Efficiency series={series} label={w.name} />;
                case 'pie':
                  return <EnergyEfficiency series={series} label={w.name} />;
                case 'line':
                  return <TreatedWaterChart title={w.name} series={series} saveLayout={saveLayout} />;
                case 'table':
                  return <FlowRaterChart title={w.name} series={series} saveLayout={saveLayout} />;
                case 'bar':
                  return <ChemicalChart title={w.name} series={series} saveLayout={saveLayout} />;
                case 'chemicaldosage':
                  return <ChemicalDosage title={w.name} series={series} saveLayout={saveLayout} />;
                case 'waterproperty':
                  return <WaterProperty {...series[0]} />;
                case 'image':
                  return <ImageComponent title={w.parameters[0].title} imgsrc={w.parameters[0].publicLink}/>
                default:
                  return (
                    <div className="text-center">
                      <p className="text-sm font-semibold">{w.name}</p>
                      <p className="text-2xl mt-1">
                        {series[0]?.value ?? '...'} {series[0]?.unit}
                      </p>
                    </div>
                  );
              }
            })()}
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
}