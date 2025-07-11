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
  const rawValue = telemetry?.[flatKey];
  return rawValue !== undefined ? rawValue : '...';
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
        const value = getValue(w.key, w.deviceId);
        return (
          <div key={w.id || w.name || `widget-${i}`} className="bg-white p-2 rounded shadow">
            {(() => {
              switch (w.type) {
                case 'donut':
                  return <Efficiency value={parseFloat(value)} label={w.name}/>;
                case 'pie':
                  return <EnergyEfficiency value={parseFloat(value)} />;
                case 'line':
                  return <TreatedWaterChart view="daily" />;
                case 'bar':
                  return <FlowRaterChart view="daily" />;
                case 'table':
                  return <ChemicalChart view="daily" />;
                case 'chemicaldosage':
                  return <ChemicalDosage view="daily" />;
                case 'waterproperty':
                  return <WaterProperty {...value} />;
                default:
                  return (
                    <div className="text-center">
                      <p className="text-sm font-semibold">{w.name}</p>
                      <p className="text-2xl mt-1">{value} {w.unit}</p>
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
