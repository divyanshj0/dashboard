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

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function WidgetRenderer({ config, layout, saveLayout, onLayoutSave, token }) {
  const [timeSeries, setTimeSeries] = useState({});

  if (!config || !config.widgets || !Array.isArray(config.widgets)) return null;

  // Fetch time-series data on mount
  useEffect(() => {
    const fetchTimeSeriesForAllWidgets = async () => {
      const result = {};

      for (const widget of config.widgets) {
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
                limit: 100,
                startTs: 1751923200000,
                endTs: 1753113599000,
                interval: 60000,
              }),
            });

            const data = await res.json();

            result[compositeKey] = Array.isArray(data[param.key])
              ? data[param.key].map((item) => ({
                  ts: Number(item.ts),
                  value: parseFloat(item.value),
                }))
              : [];
          } catch (error) {
            console.error(`Failed to fetch data for ${compositeKey}`, error);
            result[compositeKey] = [];
          }
        }
      }

      setTimeSeries(result);
    };

    fetchTimeSeriesForAllWidgets();
  }, [config, token]);

  // Helpers
  const getValue = (key, deviceId) => {
    const flatKey = `${deviceId}_${key}`;
    const point = timeSeries[flatKey]?.[timeSeries[flatKey].length - 1];
    return point ? point.value : null;
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
        // Only update layout when in edit mode
        if (!saveLayout) return;
        if (onLayoutSave) onLayoutSave(newLayout);
      }}
    >
      {config.widgets.map((w, i) => {
        const key = w.id || w.name || `widget-${i}`;
        const parameters = Array.isArray(w.parameters) ? w.parameters : [];
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
