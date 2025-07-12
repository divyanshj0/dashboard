'use client';
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

export default function WidgetRenderer({ config, telemetry, layout, onLayoutSave }) {
  if (!config || !config.widgets || !Array.isArray(config.widgets)) return null;
  const getValue = (key, deviceId) => {
    const flatKey = `${deviceId}_${key}`;
    const rawValue = telemetry?.[flatKey]?.[0]?.value;
    return rawValue !== undefined ? parseFloat(rawValue) : null;
  };

  const getSeriesData = (key, deviceId) => {
    const flatKey = `${deviceId}_${key}`;
    return telemetry?.[flatKey]?.map(item => ({
      ts: Number(item.ts),
      value: parseFloat(item.value)
    })) || [];
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
      rowHeight={100}
      isDraggable
      isResizable
      onLayoutChange={(newLayout) => {
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
          <div key={key} className="bg-white p-2 rounded shadow">
            {(() => {
              switch (w.type) {
                case 'donut':
                  return <Efficiency value={series[0]?.value || 0} label={w.name} />;
                case 'pie':
                  return <EnergyEfficiency value={series[0]?.value || 0} />;
                case 'line':
                  return <TreatedWaterChart title={w.name} series={series} />;
                case 'table':
                  return <FlowRaterChart title={w.name} series={series} />;
                case 'bar':
                  return <ChemicalChart title={w.name} series={series} />;
                case 'chemicaldosage':
                  return <ChemicalDosage title={w.name} series={series} />;
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